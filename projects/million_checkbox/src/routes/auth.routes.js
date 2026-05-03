import { Router } from 'express';
import crypto from 'crypto';
import { createToken, verifyToken } from '../middleware/auth.js';

/**
 * OIDC Relying Party (RP) auth routes.
 *
 * Delegates authentication to the separate oidc-server (oidc-provider library)
 * running on OIDC_ISSUER (default http://localhost:4000) using the
 * Authorization Code Flow:
 *
 *  GET  /auth/login     → redirect browser to OIDC server's /auth endpoint
 *  GET  /auth/callback  → receive code, exchange for tokens, get userinfo,
 *                         issue our own JWT cookie, redirect to /
 *  GET  /auth/me        → return current user from JWT cookie (used by frontend)
 *  POST /auth/logout    → clear JWT cookie + redirect to OIDC end_session endpoint
 */

const ISSUER       = () => process.env.OIDC_ISSUER       || 'http://localhost:4000';
const CLIENT_ID    = () => process.env.OIDC_CLIENT_ID    || 'my-app';
const CLIENT_SECRET= () => process.env.OIDC_CLIENT_SECRET|| 'my-app-secret';
const REDIRECT_URI = () => process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/auth/callback';

export function authRouter() {
  const router = Router();

  // ── 1. Kick off Authorization Code Flow (with PKCE S256) ────────
  router.get('/login', (req, res) => {
    // state = CSRF protection; nonce = replay protection for ID Token
    const state        = crypto.randomBytes(16).toString('hex');
    const nonce        = crypto.randomBytes(16).toString('hex');
    // PKCE: code_verifier is random 43-128 char string; challenge = BASE64URL(SHA256(verifier))
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const cookieOpts = { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' };
    res.cookie('oidc_state',         state,        cookieOpts);
    res.cookie('oidc_nonce',         nonce,        cookieOpts);
    res.cookie('oidc_code_verifier', codeVerifier, cookieOpts);

    const params = new URLSearchParams({
      client_id:             CLIENT_ID(),
      redirect_uri:          REDIRECT_URI(),
      response_type:         'code',
      scope:                 'openid profile email',
      state,
      nonce,
      code_challenge:        codeChallenge,
      code_challenge_method: 'S256',
    });

    res.redirect(`${ISSUER()}/auth?${params}`);
  });

  // ── 2. Authorization Code callback ───────────────────────────────
  router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('OIDC error:', error, error_description);
      return res.redirect('/?auth_error=' + encodeURIComponent(error_description || error));
    }

    // Validate state (CSRF check)
    const savedState    = req.cookies?.oidc_state;
    const codeVerifier  = req.cookies?.oidc_code_verifier;
    if (!state || state !== savedState) {
      return res.status(403).send('Invalid state — possible CSRF attack');
    }
    if (!codeVerifier) {
      return res.status(400).send('Missing PKCE verifier — please try signing in again');
    }
    res.clearCookie('oidc_state');
    res.clearCookie('oidc_nonce');
    res.clearCookie('oidc_code_verifier');

    if (!code) return res.status(400).send('Missing authorization code');

    try {
      // Exchange authorization code for tokens (include PKCE code_verifier)
      const tokenRes = await fetch(`${ISSUER()}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID()}:${CLIENT_SECRET()}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          code,
          redirect_uri:  REDIRECT_URI(),
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenRes.ok) {
        console.error('Token exchange failed:', await tokenRes.text());
        return res.status(500).send('Token exchange failed');
      }

      const tokens = await tokenRes.json();

      // Fetch user profile from OIDC UserInfo endpoint
      const profileRes = await fetch(`${ISSUER()}/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!profileRes.ok) {
        console.error('UserInfo failed:', await profileRes.text());
        return res.status(500).send('Failed to fetch user profile');
      }

      const profile = await profileRes.json();

      // Issue our own short-lived JWT (so the WS server can verify it from cookie)
      const token = createToken({
        sub:   profile.sub,
        email: profile.email,
        name:  profile.name || profile.preferred_username || profile.sub,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.redirect('/');
    } catch (err) {
      console.error('OIDC callback error:', err);
      res.status(500).send('Authentication failed');
    }
  });

  // ── 3. Current user (cookie-based — used by frontend on load) ────
  router.get('/me', (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.json({ user: null });

    const user = verifyToken(token);
    if (!user) return res.json({ user: null });

    res.json({ user: { sub: user.sub, email: user.email, name: user.name } });
  });

  // ── 4. Logout — clear cookie + RP-initiated logout on OIDC server ─
  router.post('/logout', (req, res) => {
    res.clearCookie('token');
    // Redirect browser to OIDC server's end_session endpoint so its
    // session is also cleared (RP-initiated logout per OIDC spec)
    const params = new URLSearchParams({
      post_logout_redirect_uri: `http://localhost:${process.env.PORT || 3001}/`,
      client_id: CLIENT_ID(),
    });
    res.json({ ok: true, logoutUrl: `${ISSUER()}/session/end?${params}` });
  });

  return router;
}
