'use strict';

require('dotenv').config();
const { Provider } = require('oidc-provider');
const Accounts     = require('./accounts');
const Adapter      = require('./adapter');
const path         = require('path');

const ISSUER   = process.env.ISSUER || 'http://localhost:4000';
const isProd   = process.env.NODE_ENV === 'production';
const CLIENTS_FILE = process.env.CLIENTS_FILE || path.join(__dirname, '../config/clients.json');

let clients = [];
try { clients = require(CLIENTS_FILE); } catch { clients = []; }

const provider = new Provider(ISSUER, {
  adapter: Adapter,
  clients,

  scopes: ['openid', 'profile', 'email', 'offline_access'],

  claims: {
    openid:  ['sub'],
    profile: ['name', 'preferred_username', 'picture', 'updated_at'],
    email:   ['email', 'email_verified'],
  },

  interactions: {
    url: async (ctx, interaction) => `/interaction/${interaction.uid}`,
  },

  cookies: {
    keys: [(process.env.COOKIE_SECRET || 'dev-secret-change-me')],
    short: { path: '/', httpOnly: true, secure: isProd, sameSite: 'lax' },
    long:  { path: '/', httpOnly: true, secure: isProd, sameSite: 'lax' },
  },

  features: {
    devInteractions: { enabled: false },
    introspection:   { enabled: true },
    revocation:      { enabled: true },
    rpInitiatedLogout: {
      enabled: true,
      logoutSource: async (ctx, form) => {
        ctx.body = `<html><body>${form}<script>document.forms[0].submit()</script></body></html>`;
      },
    },
  },

  findAccount: Accounts.findAccount,

  ttl: {
    AuthorizationCode: 600,
    AccessToken:       3600,
    IdToken:           3600,
    RefreshToken:      86400 * 14,
    Interaction:       3600,
    Session:           86400 * 14,
    Grant:             86400 * 14,
  },

  renderError: async (ctx, out) => {
    ctx.type = 'html';
    ctx.body = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Auth Error</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Playfair+Display:ital,wght@1,700&family=JetBrains+Mono:wght@700&display=swap"/>
<style>
  :root{--p:#35858e;--bg:#090e0f;--s:#0f1a1b;--b:rgba(53,133,142,0.18);--t:#e8f0ec;--tm:rgba(200,225,210,0.45);}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Manrope',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
  .c{position:relative;width:100%;max-width:400px;background:var(--s);border:1px solid var(--b);padding:44px;}
  .c::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,rgba(194,96,90,0.9),rgba(194,96,90,0.3));}
  .tag{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.4em;color:rgba(194,96,90,0.8);margin-bottom:14px;}
  .h{font-family:'Playfair Display',serif;font-style:italic;font-size:40px;font-weight:700;line-height:0.9;color:var(--t);margin-bottom:12px;}
  p{font-size:12px;color:var(--tm);line-height:1.6;margin-bottom:20px;}
  a{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:var(--p);text-decoration:none;}
</style>
</head>
<body><div class="c">
  <div class="tag">Auth / Error</div>
  <div class="h">Request<br>Failed.</div>
  <p><strong>${out.error}</strong>${out.error_description ? ' — ' + out.error_description : ''}</p>
  <a href="javascript:history.back()">&#8617; Go back</a>
</div></body></html>`;
  },
});

provider.proxy = true;
module.exports = provider;
