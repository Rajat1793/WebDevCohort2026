import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/** Express middleware — requires valid JWT cookie */
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = user;
  next();
}

/** Express middleware — attaches user if present, continues either way */
export function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (token) req.user = verifyToken(token);
  next();
}

/** Extract user from raw Cookie header (used for WebSocket upgrade) */
export function extractUserFromCookies(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }),
  );
  return verifyToken(cookies.token);
}
