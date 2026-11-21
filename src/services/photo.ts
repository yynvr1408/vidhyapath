// Client-side photo compression for photo doubts. Browser APIs only (Image, canvas, toDataURL).

const MAX_SIDE_PX = 1024;
const TARGET_BYTES = 200 * 1024;
// Lower quality step by step from 0.8, stopping at 0.4.
const JPEG_QUALITIES = [0.8, 0.7, 0.6, 0.5, 0.4];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });
}

/** Approximate decoded size in bytes of a base64 data URL. */
export function approxDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64Length = dataUrl.length - (comma + 1);
  return Math.ceil((base64Length * 3) / 4);
}

/**
 * Scales the picked image so its longest side is at most 1024 px, then encodes it as JPEG
 * at the highest quality (0.8 down to 0.4) that keeps it at 200 KB or less.
 */
export async function compressPhotoToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, MAX_SIDE_PX / longest);
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    // JPEG has no alpha channel; paint a white background first.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = '';
    for (const quality of JPEG_QUALITIES) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (approxDataUrlBytes(dataUrl) <= TARGET_BYTES) break; // size check
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
