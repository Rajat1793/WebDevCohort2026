/**
 * Custom rate limiter built on Redis — no external rate-limit packages.
 *
 * Strategy: Fixed-window counter.
 *   – Key format:  rl:{scope}:{id}:{windowNumber}
 *   – INCR increments the counter atomically.
 *   – EXPIRE sets a TTL equal to window length + 1 s buffer.
 *   – Once counter > limit the request / event is rejected.
 *
 * Two flavours are exported:
 *   1. httpRateLimiter  – Express middleware, keyed by IP address.
 *   2. wsRateLimiter    – Async function, keyed by user ID (for socket events).
 */

// ── HTTP rate limiter (Express middleware) ────────────────────────────
const HTTP_WINDOW_SEC = 60;
const HTTP_MAX = 200; // 200 requests per minute per IP

export function httpRateLimiter(redis) {
  return async (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress;
    const window = Math.floor(Date.now() / (HTTP_WINDOW_SEC * 1000));
    const key = `rl:http:${ip}:${window}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, HTTP_WINDOW_SEC + 1);

      res.set('X-RateLimit-Limit', String(HTTP_MAX));
      res.set('X-RateLimit-Remaining', String(Math.max(0, HTTP_MAX - count)));

      if (count > HTTP_MAX) {
        res.set('Retry-After', String(HTTP_WINDOW_SEC));
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }
    } catch {
      // Redis down → allow the request (fail-open)
    }

    next();
  };
}

// ── WebSocket rate limiter ───────────────────────────────────────────
const WS_WINDOW_SEC = 5;
const WS_MAX = 5; // 5 toggle events per 5 seconds per user

export async function wsRateLimiter(redis, userId) {
  const window = Math.floor(Date.now() / (WS_WINDOW_SEC * 1000));
  const key = `rl:ws:${userId}:${window}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WS_WINDOW_SEC + 1);
    return count <= WS_MAX;
  } catch {
    return true; // fail-open
  }
}
