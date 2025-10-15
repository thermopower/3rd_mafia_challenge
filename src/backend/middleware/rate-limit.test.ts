import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { rateLimit, rateLimitPresets, clearRateLimitStore } from './rate-limit';

describe('Rate Limit Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    clearRateLimitStore();
    app = new Hono();

    app.use('*', async (c, next) => {
      c.set('logger', {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      });
      await next();
    });
  });

  it('요청 횟수가 제한 이하일 때 정상적으로 통과해야 함', async () => {
    app.get(
      '/test',
      rateLimit({ windowMs: 60000, maxRequests: 3 }),
      (c) => c.json({ success: true }),
    );

    const res1 = await app.request('/test');
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(res1.headers.get('X-RateLimit-Remaining')).toBe('2');

    const res2 = await app.request('/test');
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-RateLimit-Remaining')).toBe('1');

    const res3 = await app.request('/test');
    expect(res3.status).toBe(200);
    expect(res3.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('요청 횟수가 제한을 초과하면 429 에러를 반환해야 함', async () => {
    app.get(
      '/test',
      rateLimit({ windowMs: 60000, maxRequests: 2 }),
      (c) => c.json({ success: true }),
    );

    await app.request('/test');
    await app.request('/test');

    const res = await app.request('/test');
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.error.details.retryAfter).toBeDefined();
  });

  it('다른 IP는 별도로 카운트되어야 함', async () => {
    app.get(
      '/test',
      rateLimit({ windowMs: 60000, maxRequests: 2 }),
      (c) => c.json({ success: true }),
    );

    const res1 = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });
    expect(res2.status).toBe(200);

    const res3 = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    expect(res3.status).toBe(200);

    const res4 = await app.request('/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });
    expect(res4.status).toBe(429);
  });

  it('커스텀 키 생성기를 사용할 수 있어야 함', async () => {
    app.get(
      '/test',
      rateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (c) => c.req.header('user-id') || 'anonymous',
      }),
      (c) => c.json({ success: true }),
    );

    const res1 = await app.request('/test', {
      headers: { 'user-id': 'user123' },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request('/test', {
      headers: { 'user-id': 'user456' },
    });
    expect(res2.status).toBe(200);

    const res3 = await app.request('/test', {
      headers: { 'user-id': 'user123' },
    });
    expect(res3.status).toBe(200);

    const res4 = await app.request('/test', {
      headers: { 'user-id': 'user123' },
    });
    expect(res4.status).toBe(429);
  });

  it('프리셋 설정이 올바르게 정의되어 있어야 함', () => {
    expect(rateLimitPresets.favoriteToggle.windowMs).toBe(60000);
    expect(rateLimitPresets.favoriteToggle.maxRequests).toBe(10);

    expect(rateLimitPresets.reservationLookup.windowMs).toBe(60000);
    expect(rateLimitPresets.reservationLookup.maxRequests).toBe(5);

    expect(rateLimitPresets.default.windowMs).toBe(60000);
    expect(rateLimitPresets.default.maxRequests).toBe(100);
  });

  it('X-RateLimit-Reset 헤더가 올바른 값을 반환해야 함', async () => {
    app.get(
      '/test',
      rateLimit({ windowMs: 60000, maxRequests: 5 }),
      (c) => c.json({ success: true }),
    );

    const res = await app.request('/test');
    const resetHeader = res.headers.get('X-RateLimit-Reset');

    expect(resetHeader).toBeDefined();
    const resetInSeconds = parseInt(resetHeader!);
    expect(resetInSeconds).toBeGreaterThan(0);
    expect(resetInSeconds).toBeLessThanOrEqual(60);
  });
});
