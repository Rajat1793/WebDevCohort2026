# OIDC Server

> A **standalone, drop-in OpenID Connect Authorization Server** built on [oidc-provider v7](https://github.com/panva/node-oidc-provider).  
> Self-host it once, point any number of apps at it — no UI changes, no coupling to any project.

---

## What It Does

- Implements the full **Authorization Code flow with PKCE**
- Issues **access tokens**, **ID tokens**, and **refresh tokens**
- Handles **login**, **registration**, and **consent** with a built-in dark UI
- Supports **RP-initiated logout** (clears the server-side session on sign-out)
- Clients and users are plain JSON files — no database required to get started
- Exposes a standard **OIDC discovery endpoint** so any compliant client library auto-configures

---

## Quick Start

```bash
npm install
cp .env.example .env    # set COOKIE_SECRET
npm start               # http://localhost:4000
```

Verify it's running:
```bash
curl http://localhost:4000/.well-known/openid-configuration
```

---

## Project Structure

```
oidc-server/
├── config/
│   ├── clients.json        # registered client applications
│   └── users.json          # user accounts (auto-updated on register)
├── src/
│   ├── server.js           # Express entry point
│   ├── provider.js         # oidc-provider configuration
│   ├── accounts.js         # user lookup, authentication, registration
│   ├── adapter.js          # in-memory store (replace with Redis for prod)
│   ├── routes/
│   │   └── interaction.js  # login / register / consent / abort handlers
│   └── views/
│       ├── login.ejs       # sign-in + register tabs
│       └── consent.ejs     # OAuth consent screen
├── .env.example
└── package.json
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port to listen on |
| `ISSUER` | `http://localhost:4000` | Public base URL — must match what clients send as `issuer` |
| `COOKIE_SECRET` | *(required)* | Random string ≥ 32 chars, signs session cookies |
| `NODE_ENV` | `development` | Set to `production` to enable `Secure` cookies (requires HTTPS) |
| `CLIENTS_FILE` | `config/clients.json` | Absolute or relative path to clients config |
| `USERS_FILE` | `config/users.json` | Absolute or relative path to users file |

Copy `.env.example` to `.env` and fill in `COOKIE_SECRET` before starting.

---

## Registering a Client App

Edit `config/clients.json`. Each object is one client application. Restart the server after changes.

```json
[
  {
    "client_id": "my-app",
    "client_secret": "my-app-secret",
    "redirect_uris": ["http://localhost:3001/auth/callback"],
    "post_logout_redirect_uris": ["http://localhost:3001/"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email offline_access",
    "token_endpoint_auth_method": "client_secret_basic"
  }
]
```

Multiple clients are supported — just add more objects to the array.

**Required fields per client:**

| Field | Description |
|---|---|
| `client_id` | Unique identifier for the app |
| `client_secret` | Shared secret (used for token endpoint auth) |
| `redirect_uris` | Allowed callback URLs after login |
| `post_logout_redirect_uris` | Allowed redirect URLs after logout |
| `grant_types` | `["authorization_code"]` minimum; add `"refresh_token"` for long sessions |
| `response_types` | `["code"]` for Authorization Code flow |
| `scope` | Space-separated allowed scopes |

---

## Pointing Your App at This Server

Set these in your application's environment:

```env
OIDC_ISSUER_URL=http://localhost:4000
OIDC_CLIENT_ID=my-app
OIDC_CLIENT_SECRET=my-app-secret
OIDC_CALLBACK_URL=http://localhost:3001/auth/callback
```

Your client library will auto-discover all endpoints from:
```
GET http://localhost:4000/.well-known/openid-configuration
```

### Example: Express app with openid-client v5

```js
const { Issuer, generators } = require('openid-client');

const issuer = await Issuer.discover('http://localhost:4000');
const client = new issuer.Client({
  client_id: 'my-app',
  client_secret: 'my-app-secret',
  redirect_uris: ['http://localhost:3001/auth/callback'],
  response_types: ['code'],
});

// Initiate login (PKCE)
const codeVerifier = generators.codeVerifier();
const codeChallenge = generators.codeChallenge(codeVerifier);

const authUrl = client.authorizationUrl({
  scope: 'openid profile email',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

// Handle callback
const params = client.callbackParams(req);
const tokenSet = await client.callback(
  'http://localhost:3001/auth/callback',
  params,
  { code_verifier: codeVerifier }
);

const userInfo = await client.userinfo(tokenSet.access_token);
```

### Logout (RP-initiated)

To fully clear the OIDC server session on logout, redirect the user to the `end_session_endpoint` with the `id_token_hint`:

```js
const endSessionUrl = `http://localhost:4000/session/end`
  + `?id_token_hint=${encodeURIComponent(idToken)}`
  + `&post_logout_redirect_uri=${encodeURIComponent('http://localhost:3001/')}`;

res.redirect(endSessionUrl);
```

Store the `id_token` from the token exchange at login time — you'll need it here.

---

## Managing Users

Users are stored in `config/users.json`. Passwords are **bcrypt** hashes (cost 10).

### Seed a user manually

```json
[
  {
    "id": "user_alice",
    "username": "alice",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "<bcrypt hash of password>"
  }
]
```

Generate a hash:
```bash
node -e "require('bcryptjs').hash('yourpassword', 10).then(h => console.log(h))"
```

### Register via UI

Users who register through the login screen are **automatically appended** to `users.json` — no restart needed.

---

## OIDC Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/.well-known/openid-configuration` | Discovery document (auto-configure clients) |
| `GET` | `/auth` | Authorization endpoint — starts login flow |
| `POST` | `/token` | Token endpoint — exchange code for tokens |
| `GET` | `/me` | UserInfo endpoint — returns claims for access token |
| `GET` | `/session/end` | RP-initiated logout |
| `POST` | `/token/introspection` | Validate a token (for resource servers) |
| `POST` | `/token/revocation` | Revoke an access or refresh token |
| `GET` | `/jwks` | JSON Web Key Set — public keys for token verification |

---

## Claims & Scopes

| Scope | Claims returned |
|---|---|
| `openid` | `sub` (always included) |
| `profile` | `name`, `preferred_username`, `picture`, `updated_at` |
| `email` | `email`, `email_verified` |
| `offline_access` | issues a `refresh_token` |

---

## Token Lifetimes

| Token | Lifetime |
|---|---|
| Authorization Code | 10 minutes |
| Access Token | 1 hour |
| ID Token | 1 hour |
| Refresh Token | 14 days |
| Session | 14 days |

---

## Production Checklist

- [ ] Set `NODE_ENV=production` — enables `Secure` flag on cookies (requires HTTPS)
- [ ] Set a strong random `COOKIE_SECRET` (≥ 32 chars) — never commit it
- [ ] Replace `src/adapter.js` with a [Redis adapter](https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#adapter) — in-memory state is lost on restart
- [ ] Set `ISSUER` to your public HTTPS domain (e.g. `https://auth.yourdomain.com`)
- [ ] Update `redirect_uris` in `clients.json` to production URLs
- [ ] Run behind a reverse proxy (nginx/Caddy) — `provider.proxy = true` is already set
- [ ] Add rate limiting to `/interaction` routes

---

## Development

```bash
npm run dev     # starts with nodemon (auto-restart on file change)
```

Demo accounts (pre-seeded in `config/users.json`):

| Username | Password |
|---|---|
| alice | password123 |
| bob | password123 |
