// Authentication, Password Hashing, Session JWT & OTP Security Service
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole, OtpRecord } from '../../src/types/enterprise.js';
import { dataStore } from '../db/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vidyapath-enterprise-secret-key-2026';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_ATTEMPTS = 5;

// Failed login attempt tracking for account lockout
interface LoginTracker {
  attempts: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginTracker>();

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  fullName: string;
  iat: number;
  exp: number;
}

export class AuthService {
  // Generate HMAC-SHA256 Signed JWT Token (Stateless & tamper-proof)
  static generateToken(user: User, expiresInSeconds = 7 * 24 * 3600): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      fullName: user.fullName,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodeBase64Url = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const hB64 = encodeBase64Url(header);
    const pB64 = encodeBase64Url(payload);
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${hB64}.${pB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${hB64}.${pB64}.${signature}`;
  }

  // Verify and decode JWT token
  static verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [hB64, pB64, sig] = parts;

      const expectedSig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${hB64}.${pB64}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      if (sig !== expectedSig) return null;

      const payload: TokenPayload = JSON.parse(
        Buffer.from(pB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
      );

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  // OTP Generation & Verification with Cryptographic Security
  static generateOtp(email: string, purpose: OtpRecord['purpose']): { otp: string; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = dataStore.otps.get(`${normalizedEmail}_${purpose}`);

    // Check resend cooldown
    if (existing && Date.now() - existing.createdAt < OTP_RESEND_COOLDOWN_MS) {
      const remainingSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.createdAt)) / 1000);
      return { otp: '', error: `Please wait ${remainingSec}s before requesting a new verification code.` };
    }

    // Cryptographically secure 6-digit random code (100000 - 999999)
    const code = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(code).digest('hex');

    const record: OtpRecord = {
      id: 'otp_' + crypto.randomUUID(),
      email: normalizedEmail,
      otpHash,
      purpose,
      attempts: 0,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      createdAt: Date.now(),
    };

    dataStore.otps.set(`${normalizedEmail}_${purpose}`, record);
    return { otp: code };
  }

  static verifyOtp(email: string, purpose: OtpRecord['purpose'], inputCode: string): { success: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const key = `${normalizedEmail}_${purpose}`;
    const record = dataStore.otps.get(key);

    if (!record) {
      return { success: false, message: 'No active verification code found. Please request a new one.' };
    }

    if (Date.now() > record.expiresAt) {
      dataStore.otps.delete(key);
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      dataStore.otps.delete(key);
      return { success: false, message: 'Too many incorrect attempts. This code is invalidated for your security.' };
    }

    record.attempts += 1;
    const computedHash = crypto.createHash('sha256').update(inputCode.trim()).digest('hex');

    if (computedHash !== record.otpHash) {
      const remaining = MAX_OTP_ATTEMPTS - record.attempts;
      return { success: false, message: `Invalid code. ${remaining} attempts remaining.` };
    }

    // Successful: Single-use invalidation
    dataStore.otps.delete(key);
    return { success: true, message: 'Verification successful.' };
  }

  // Account Lockout Protection
  static checkAccountLockout(email: string): { locked: boolean; waitSeconds?: number } {
    const normalized = email.trim().toLowerCase();
    const tracker = loginAttempts.get(normalized);
    if (!tracker) return { locked: false };

    if (tracker.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((tracker.lockedUntil - Date.now()) / 1000);
      return { locked: true, waitSeconds };
    }

    if (tracker.lockedUntil > 0 && tracker.lockedUntil <= Date.now()) {
      loginAttempts.delete(normalized);
    }
    return { locked: false };
  }

  static recordLoginFailure(email: string) {
    const normalized = email.trim().toLowerCase();
    const tracker = loginAttempts.get(normalized) || { attempts: 0, lockedUntil: 0 };
    tracker.attempts += 1;
    if (tracker.attempts >= 5) {
      tracker.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lockout
    }
    loginAttempts.set(normalized, tracker);
  }

  static recordLoginSuccess(email: string) {
    loginAttempts.delete(email.trim().toLowerCase());
  }
}

// Express Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.slice(7).trim();
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }

  req.user = payload;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role "${req.user.role}" does not have permission for this resource.`,
      });
    }
    next();
  };
}
