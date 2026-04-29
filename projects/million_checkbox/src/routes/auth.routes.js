import { Router } from 'express';
import crypto from 'crypto';
import { createToken, verifyToken } from '../middleware/auth.js';

/**
 * Custom OIDC-style authentication server.
 *
 * Implements the core concepts of OpenID Connect without relying on
 * an external provider (Google, GitHub, etc.):
 *
 *  - POST /auth/register  → create a new user (stores hashed password in Redis)
 *  - POST /auth/login     → verify credentials, issue a JWT (ID Token)
 *  - GET  /auth/me        → UserInfo endpoint (returns claims from the token)
 *  - GET  /auth/userinfo  → Standard OIDC UserInfo endpoint (Bearer token)
 *  - POST /auth/logout    → clear session cookie
 *
 * Passwords are hashed using PBKDF2 (built-in crypto, no bcrypt dep needed).
 */

const HASH_ITERATIONS = 100_000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex'));
    });
  });
}

export function authRouter(redis) {
  const router = Router();

  // ── Register ─────────────────────────────────────────────────────
  router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = await redis.get(`oidc:user:${email}`);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Hash password
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await hashPassword(password, salt);
    const sub = crypto.randomUUID(); // unique subject identifier (OIDC `sub` claim)

    // Store user in Redis (no TTL — permanent)
    const userObj = { sub, email, name, salt, hash, createdAt: Date.now() };
    await redis.set(`oidc:user:${email}`, JSON.stringify(userObj));
    await redis.set(`oidc:sub:${sub}`, email); // reverse lookup by sub

    // Issue JWT (acts as OIDC ID Token)
    const token = createToken({ sub, email, name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({ user: { sub, email, name } });
  });

  // ── Login ────────────────────────────────────────────────────────
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const raw = await redis.get(`oidc:user:${email}`);
    if (!raw) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = JSON.parse(raw);
    const hash = await hashPassword(password, userObj.salt);

    if (hash !== userObj.hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue JWT (ID Token)
    const token = createToken({ sub: userObj.sub, email: userObj.email, name: userObj.name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({ user: { sub: userObj.sub, email: userObj.email, name: userObj.name } });
  });

  // ── Current user (cookie-based) ─────────────────────────────────
  router.get('/me', (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.json({ user: null });

    const user = verifyToken(token);
    if (!user) return res.json({ user: null });

    res.json({ user: { sub: user.sub, email: user.email, name: user.name } });
  });

  // ── OIDC UserInfo endpoint (Bearer token) ────────────────────────
  router.get('/userinfo', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token required' });
    }

    const user = verifyToken(authHeader.slice(7));
    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });

    // Standard OIDC UserInfo response
    res.json({ sub: user.sub, email: user.email, name: user.name });
  });

  // ── Logout ───────────────────────────────────────────────────────
  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
  });

  return router;
}
