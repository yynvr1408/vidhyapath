// Learner PIN hashing using Web Crypto only (PBKDF2-SHA256).
// Stored format: 'pbkdf2$<iterations>$<base64 salt>$<base64 hash>'.
// Values without the 'pbkdf2$' prefix are treated as legacy plaintext PINs
// (see verifyPin and the migration note there).

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BITS = 256;
const PREFIX = 'pbkdf2$';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const derive = async (
  pin: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BITS,
  );
  return new Uint8Array(bits);
};

export async function hashPin(pin: string): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(SALT_BYTES));
  crypto.getRandomValues(salt);
  const hash = await derive(pin, salt, PBKDF2_ITERATIONS);
  return `${PREFIX}${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  try {
    if (typeof pin !== 'string' || typeof stored !== 'string') {
      return false;
    }

    // Legacy plaintext PIN. The caller migrates it to the hashed form
    // once this returns true.
    if (!stored.startsWith(PREFIX)) {
      return pin === stored;
    }

    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }

    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    const actual = await derive(pin, salt, iterations);

    if (actual.length !== expected.length) {
      return false;
    }

    // Constant-time comparison: accumulate XOR differences over all bytes.
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= actual[i] ^ expected[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}
