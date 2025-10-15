import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@/backend/hono/context';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: any) => string;
}

interface RateLimitStore {
  requests: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

const DEFAULT_KEY_GENERATOR = (c: any): string => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown';
  return `${ip}:${c.req.path}`;
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
};

setInterval(cleanupExpiredEntries, 60000);

export const rateLimit = (config: RateLimitConfig): MiddlewareHandler<AppEnv> => {
  const { windowMs, maxRequests, keyGenerator = DEFAULT_KEY_GENERATOR } = config;

  return async (c, next) => {
    const logger = c.get('logger');
    const key = keyGenerator(c);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        requests: 0,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    }

    record.requests += 1;

    const remaining = Math.max(0, maxRequests - record.requests);
    const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetInSeconds.toString());

    if (record.requests > maxRequests) {
      logger.warn(
        `Rate limit exceeded for key: ${key}, requests: ${record.requests}/${maxRequests}`,
      );

      return c.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter: resetInSeconds,
            },
          },
        },
        429,
      );
    }

    logger.info(
      `Rate limit check passed for key: ${key}, requests: ${record.requests}/${maxRequests}`,
    );

    await next();
  };
};

export const rateLimitPresets = {
  favoriteToggle: {
    windowMs: 60000,
    maxRequests: 10,
  },
  reservationLookup: {
    windowMs: 60000,
    maxRequests: 5,
  },
  default: {
    windowMs: 60000,
    maxRequests: 100,
  },
};

export const clearRateLimitStore = () => {
  store.clear();
};
