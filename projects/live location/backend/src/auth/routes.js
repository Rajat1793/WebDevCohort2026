'use strict';

const express = require('express');
const { getOidcClient, generators } = require('./oidcClient');
const config = require('../config');

const router = express.Router();

router.get('/login', async (req, res) => {
  try {
    const client = await getOidcClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();
    req.session.oidc = { codeVerifier, state, nonce };
    const authUrl = client.authorizationUrl({
      scope: 'openid profile email',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'login',
    });
    res.redirect(authUrl);
  } catch (err) {
    console.error('[Auth] OIDC login error:', err.message);
    res.redirect('/?error=auth_server_unavailable');
  }
});

router.get('/callback', async (req, res) => {
  try {
    const client = await getOidcClient();
    const { codeVerifier, state, nonce } = req.session.oidc || {};
    delete req.session.oidc;

    if (!codeVerifier || !state) return res.redirect('/auth/login');

    const params = client.callbackParams(req);

    // User denied or OIDC server returned an error — go back to login, don't restart the flow
    if (params.error) {
      console.warn('[Auth] Callback error from OIDC:', params.error, params.error_description);
      return res.redirect('/auth/login');
    }

    const tokenSet = await client.callback(config.oidc.callbackUrl, params, {
      code_verifier: codeVerifier,
      state,
      nonce,
    });
    const userinfo = await client.userinfo(tokenSet);
    req.session.user = {
      id: userinfo.sub,
      displayName: userinfo.name || userinfo.preferred_username,
      email: userinfo.email,
      avatar: userinfo.picture,
    };
    req.session.idToken = tokenSet.id_token;
    res.redirect('/');
  } catch (err) {
    console.error('[Auth] OIDC callback error:', err.message);
    res.redirect('/?error=auth_failed');
  }
});

router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ user: req.session.user });
  return res.status(401).json({ error: 'Not authenticated' });
});

router.post('/logout', async (req, res) => {
  const idToken = req.session.idToken;
  req.session.destroy((err) => {
    if (err) console.error('[Auth] Session destroy error:', err.message);
    res.clearCookie('connect.sid', { path: '/' });
    if (idToken) {
      const endSessionUrl = `${config.oidc.issuerUrl}/session/end`
        + `?id_token_hint=${encodeURIComponent(idToken)}`
        + `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:3001/')}`;
      return res.json({ redirect: endSessionUrl });
    }
    return res.json({ redirect: '/auth/login' });
  });
});

module.exports = router;
