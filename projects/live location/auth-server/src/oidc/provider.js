'use strict';

require('dotenv').config();

const { Provider } = require('oidc-provider');
const Account = require('./accounts');
const MemoryAdapter = require('./adapter');

const ISSUER = process.env.ISSUER || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

const configuration = {
  adapter: MemoryAdapter,

  clients: [
    {
      client_id: process.env.OIDC_CLIENT_ID || 'live-location-app',
      client_secret: process.env.OIDC_CLIENT_SECRET || 'live-location-secret',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: [process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/auth/callback'],
      post_logout_redirect_uris: [(process.env.OIDC_POST_LOGOUT_URI || 'http://localhost:3001/')],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
      scope: 'openid profile email offline_access',
      require_pkce: false,
    },
  ],

  scopes: ['openid', 'profile', 'email', 'offline_access'],

  claims: {
    openid: ['sub'],
    profile: ['name', 'preferred_username', 'picture', 'updated_at'],
    email: ['email', 'email_verified'],
  },

  interactions: {
    url: async (ctx, interaction) => `/interaction/${interaction.uid}`,
  },

  cookies: {
    keys: [(process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-prod')],
    short: { path: '/', httpOnly: true, secure: isProduction, sameSite: 'lax' },
    long: { path: '/', httpOnly: true, secure: isProduction, sameSite: 'lax' },
  },

  features: {
    devInteractions: { enabled: false },
    introspection: { enabled: true },
    revocation: { enabled: true },
    rpInitiatedLogout: {
      enabled: true,
      logoutSource: async (ctx, form) => {
        ctx.body = `<html><body>${form}<script>document.forms[0].submit()</script></body></html>`;
      },
    },
  },

  findAccount: Account.findAccount,

  ttl: {
    AuthorizationCode: 600,
    AccessToken: 3600,
    IdToken: 3600,
    RefreshToken: 86400 * 14,
    Interaction: 3600,
    Session: 86400 * 14,
    Grant: 86400 * 14,
  },

  renderError: async (ctx, out) => {
    ctx.type = 'html';
    ctx.body = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>GeoLink — Error</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Playfair+Display:ital,wght@1,700&family=JetBrains+Mono:wght@400;700&display=swap"/>
<style>
  :root{--primary:#35858e;--bg:#090e0f;--surface:#0f1a1b;--border:rgba(53,133,142,0.18);--text:#e8f0ec;--text-muted:rgba(200,225,210,0.45);--danger:rgba(194,96,90,0.8);}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Manrope',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 65% 80% at 70% 50%,rgba(53,133,142,0.07) 0%,transparent 70%)}
  .card{position:relative;z-index:1;width:100%;max-width:400px;background:var(--surface);border:1px solid var(--border);padding:44px}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--danger) 0%,rgba(194,96,90,0.4) 100%)}
  .tag{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.4em;color:var(--danger);margin-bottom:16px}
  .heading{font-family:'Playfair Display',serif;font-style:italic;font-size:40px;font-weight:700;line-height:0.9;color:var(--text);margin-bottom:12px}
  .msg{font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:24px}
  a{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:var(--primary);text-decoration:none}
  a:hover{text-decoration:underline}
</style>
</head>
<body><div class="card">
  <div class="tag">GeoLink / Error</div>
  <div class="heading">Auth<br>Failed.</div>
  <p class="msg"><strong>${out.error}</strong>${out.error_description ? ' — ' + out.error_description : ''}</p>
  <a href="javascript:history.back()">&#8617; Go back</a>
</div></body></html>`;
  },
};

const provider = new Provider(ISSUER, configuration);
provider.proxy = true;

module.exports = provider;
