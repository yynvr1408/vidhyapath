// Enterprise Idempotency Middleware for Safe Retries & Zero-Duplicate Guarantees
import { Request, Response, NextFunction } from 'express';

interface IdempotencyCacheEntry {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  createdAt: number;
}

// In-memory LRU/TTL store for idempotent transaction receipts
const idempotencyStore = new Map<string, IdempotencyCacheEntry>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup stale keys
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to mutating requests (POST, PUT, PATCH, DELETE)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;
  if (!idempotencyKey) {
    // If no key provided, proceed normally
    return next();
  }

  const normalizedKey = `${req.method}_${req.baseUrl || ''}${req.path}_${idempotencyKey.trim()}`;

  // Check if previously processed
  const cached = idempotencyStore.get(normalizedKey);
  if (cached) {
    res.setHeader('X-Cache', 'IDEMPOTENT-HIT');
    res.setHeader('X-Idempotency-Key', idempotencyKey);
    return res.status(cached.statusCode).json(cached.body);
  }

  // Intercept response to store result
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    // Only cache successful or client validation outcomes (2xx, 4xx), not server errors (5xx)
    if (res.statusCode < 500) {
      idempotencyStore.set(normalizedKey, {
        statusCode: res.statusCode,
        headers: {},
        body,
        createdAt: Date.now(),
      });
    }

    res.setHeader('X-Cache', 'IDEMPOTENT-MISS');
    res.setHeader('X-Idempotency-Key', idempotencyKey);
    return originalJson(body);
  };

  next();
}
