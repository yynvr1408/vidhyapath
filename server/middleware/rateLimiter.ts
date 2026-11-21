// High-Performance Sliding Window Rate Limiter Middleware
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests. Rate limit exceeded, please try again later.',
    keyGenerator = (req: Request) => {
      const authHeader = req.headers.authorization;
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '127.0.0.1';
      return authHeader ? `${authHeader}_${clientIp}` : clientIp;
    },
  } = options;

  const storage = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of storage.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        storage.delete(key);
      }
    }
  }, Math.max(windowMs, 30000));

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = storage.get(key);
    if (!record) {
      record = { timestamps: [] };
      storage.set(key, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    const oldest = record.timestamps[0] || now;
    const resetTimeSec = Math.ceil((oldest + windowMs - now) / 1000);

    // Standard RFC RateLimit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining - 1));
    res.setHeader('X-RateLimit-Reset', resetTimeSec);

    if (record.timestamps.length >= maxRequests) {
      res.setHeader('Retry-After', resetTimeSec);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: resetTimeSec,
        rateLimited: true,
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured enterprise rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 login/register attempts per 15 min
  message: 'Authentication rate limit reached. Please wait 15 minutes to prevent account lockout.',
});

export const tutorRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 queries/minute (matches Groq Cloud TPM constraints)
  message: 'AI Tutor query burst limit reached. Please pause for 60 seconds to allow thoughtful study.',
});

export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300, // 300 general API reads per minute
  message: 'General API rate limit reached. Please slow down your requests.',
});
