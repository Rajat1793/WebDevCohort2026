# Million Checkboxes

A real-time, full-stack web application where users interact with a grid of **1 000 000 checkboxes**. Every toggle is instantly reflected for all connected users. Built from scratch with Node.js, WebSockets, Redis, and a custom identity server — no third-party auth providers, no rate-limit packages.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How to Run Locally](#how-to-run-locally)
5. [Architecture Deep Dive](#architecture-deep-dive)
   - [Frontend: Canvas-based rendering](#1-frontend-canvas-based-rendering)
   - [Authentication: Custom OIDC](#2-authentication-custom-oidc)
   - [WebSocket: Real-time sync](#3-websocket-real-time-sync)
   - [Redis: Bitmap state storage](#4-redis-bitmap-state-storage)
   - [Redis Pub/Sub: Multi-instance broadcast](#5-redis-pubsub-multi-instance-broadcast)
   - [Rate Limiting: Custom implementation](#6-rate-limiting-custom-implementation)
6. [Redis Key Reference](#redis-key-reference)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)

---

## What it does

- A 1 000 × 1 000 grid of checkboxes (1 000 000 total) is displayed in the browser
- Authenticated users can toggle any checkbox
- Anonymous (not logged in) users get read-only access — they see the live state but cannot toggle
- Every toggle is broadcast in real time to all connected users via WebSocket
- The grid state is persisted in Redis as a compact bitmap — survives server restarts
- Rate limiting prevents spam: users are capped at 5 toggles per 5 seconds, with a visual cooldown countdown

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JavaScript | No build step, no framework overhead |
| Rendering | `<canvas>` API | DOM can't handle 1M elements — canvas draws only visible cells |
| Server | Node.js + Express (ESM) | Lightweight, native WebSocket support |
| Real-time | `ws` library | Raw WebSocket — no Socket.IO overhead |
| State | Redis bitmap (`SETBIT`/`GETBIT`) | 1M bits = 125 KB; O(1) per toggle |
| Pub/Sub | Redis `PUBLISH`/`SUBSCRIBE` | Syncs updates across multiple server instances |
| Auth | Custom OIDC — JWT + PBKDF2 | Self-contained; no Google/GitHub keys needed |
| Rate Limiting | Custom Redis counters | Built from scratch — no `express-rate-limit` |
| Session | httpOnly JWT cookie | Secure, works with WebSocket upgrades |

---

## Project Structure

```
million_checkbox/
├── server.js                   Entry point — boots Express, WebSocket server, Redis
├── package.json
├── .env.example                Copy to .env and fill in JWT_SECRET
├── docker-compose.yml          One-command Redis setup
│
├── public/                     Static files served directly by Express
│   ├── index.html              App shell — navbar, auth modal, grid container
│   ├── style.css               Dark theme, layout, modal, cooldown popup
│   └── app.js                  All client-side logic: canvas grid, WS client, auth UI
│
└── src/
    ├── config/
    │   └── redis.js             ioredis client factory with retry strategy
    ├── middleware/
    │   ├── auth.js              JWT sign/verify, Express middleware, cookie extraction
    │   └── rateLimiter.js       Custom HTTP + WebSocket rate limiter (Redis-backed)
    ├── routes/
    │   ├── auth.routes.js       OIDC endpoints: /register, /login, /me, /userinfo, /logout
    │   └── api.routes.js        REST endpoints: GET /api/checkboxes, GET /api/stats
    ├── services/
    │   ├── checkbox.js          Redis bitmap helpers + Lua atomic toggle script
    │   └── pubsub.js            Redis Pub/Sub publish + subscribe for cross-server sync
    └── socket/
        └── handler.js           WebSocket connection manager, toggle events, user tracking
```

---

## How to Run Locally

### Prerequisites

- **Node.js** ≥ 18
- **Redis** (local or Docker)

### Start Redis

```bash
# Docker (easiest)
docker compose up -d

# macOS with Homebrew
brew install redis && brew services start redis

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis
```

### Start the App

```bash
cp .env.example .env        # set JWT_SECRET to any long random string
npm install
npm run dev                  # → http://localhost:3000
```

---

## Architecture Deep Dive

### 1. Frontend: Canvas-based rendering

**The problem:** 1 000 000 checkboxes cannot be rendered as DOM elements. Even 10 000 `<div>` elements cause the browser to slow to a crawl from layout recalculation.

**The solution:** A single `<canvas>` element inside a scroll container.

```
┌─────────────────────────────────────────┐
│  .scroll-container  (overflow: auto)    │
│  ┌─────────────────────────────────────┐│
│  │  #scroll-inner  16 000 × 16 000 px  ││  ← defines scrollable area
│  │  ┌─────────────────────────────────┐││
│  │  │  <canvas>  position: sticky     │││  ← always fills the viewport
│  │  └─────────────────────────────────┘││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

- The `scroll-inner` div is sized to 16 000 × 16 000 px (1000 cols × 16 px per cell)
- The canvas has `position: sticky; top: 0; left: 0` — it stays pinned to the visible viewport
- On every scroll event and state update, `render()` is called via `requestAnimationFrame`
- `render()` only draws cells that are currently visible — a ~60×40 cell window out of 1 000 000

**Viewport culling:**
```js
const startCol = Math.floor(scrollLeft / CELL_SIZE);
const startRow = Math.floor(scrollTop  / CELL_SIZE);
const endCol   = startCol + Math.ceil(viewportWidth  / CELL_SIZE) + 1;
const endRow   = startRow + Math.ceil(viewportHeight / CELL_SIZE) + 1;
// Only iterate these ~2400 cells, not 1 000 000
```

**State representation:**  
Client holds a `Uint8Array` of 125 000 bytes — a local copy of the Redis bitmap. `getBit(i)` and `setBit(i, v)` use bitwise ops to read/write individual checkbox states in O(1).

---

### 2. Authentication: Custom OIDC

**Why custom OIDC?**  
External providers (Google, GitHub) require app registration, credentials, and internet access. A self-contained identity server means zero external dependencies. The implementation follows the **OpenID Connect Core** spec at the concepts level: it issues JWTs with OIDC standard claims (`sub`, `email`, `name`) and exposes a `/auth/userinfo` endpoint.

**How it works:**

```
REGISTRATION
  Browser → POST /auth/register { email, password, name }
            Server:
              1. Check email not already taken (GET oidc:user:{email})
              2. Generate random 32-byte salt
              3. PBKDF2(password, salt, 100_000 iterations, 64 bytes, SHA-512)
              4. Store { sub, email, name, salt, hash } → SET oidc:user:{email}
              5. Store reverse lookup → SET oidc:sub:{sub} email
              6. Sign JWT: { sub, email, name, exp: +7d }
              7. Set httpOnly cookie: token=<jwt>
            Browser ← 201 { user: { sub, email, name } }

LOGIN
  Browser → POST /auth/login { email, password }
            Server:
              1. GET oidc:user:{email}
              2. PBKDF2(password, storedSalt) → compare hash
              3. If match: sign JWT, set cookie
            Browser ← 200 { user } or 401 error
```

**Why PBKDF2?**  
It's built into Node's `crypto` module — no bcrypt/argon2 dependency. 100 000 iterations makes brute-force attacks expensive (each guess takes ~50ms of server CPU).

**Why JWT over server sessions?**  
JWTs are stateless — the server doesn't need to store session state. Critically, JWTs work seamlessly for WebSocket authentication: the browser sends the cookie during the HTTP upgrade request, the server extracts and verifies it before the WS connection is accepted.

**JWT claims (OIDC ID Token structure):**
```json
{
  "sub": "uuid-v4",
  "email": "user@example.com",
  "name": "Alice",
  "iat": 1714391234,
  "exp": 1714996034
}
```

**OIDC endpoints:**

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Create account, returns JWT cookie |
| `POST /auth/login` | Verify credentials, returns JWT cookie |
| `GET /auth/me` | Returns current user from cookie (used by frontend on load) |
| `GET /auth/userinfo` | Standard OIDC UserInfo — accepts `Authorization: Bearer <jwt>` |
| `POST /auth/logout` | Clears cookie |

---

### 3. WebSocket: Real-time sync

WebSocket is used instead of HTTP polling because:
- Polling wastes bandwidth (most polls return "no change")
- WebSocket gives sub-100ms propagation with no repeated overhead
- The server can push to all clients without being asked

**Connection lifecycle:**

```
1. Browser opens WS connection (HTTP upgrade, cookie sent automatically)
2. Server extracts JWT from cookie header → authenticates user
3. Server sends { type: "connected", authenticated: true/false, connectedUsers: N }
4. Browser fetches bitmap via GET /api/checkboxes (REST, not WS — avoids base64 overhead)
5. Subsequent toggles flow over WS
6. On WS close: reconnect with exponential backoff (500ms → 750ms → 1125ms → ... → 10s max)
```

**Toggle event flow:**
```
Client sends:   { type: "toggle", index: 42137 }

Server:
  1. Check user is authenticated (reject anon users with error message)
  2. Check rate limit (Redis counter)
  3. Run Lua script on Redis: atomically flip bit, return new state
  4. Broadcast to all local WS clients: { type: "toggle", index: 42137, state: 1 }
  5. Publish to Redis channel: { index: 42137, state: 1, serverId: "uuid" }

Other server instances:
  6. Receive from Redis Pub/Sub
  7. Broadcast to their own local WS clients
```

---

### 4. Redis: Bitmap state storage

**Why a bitmap?**  
A naive approach would store each checkbox as a Redis key (`checkbox:42137 = 1`). For 1M checkboxes that's 1M keys — expensive in memory and slow to initialize a new client.

A Redis bitmap stores all 1M states as a single string of bits:

```
cb:bitmap  →  [bit 0][bit 1][bit 2]...[bit 999999]
            = 1 000 000 bits = 125 000 bytes = 125 KB
```

Operations:
- `SETBIT cb:bitmap 42137 1` — check box #42137
- `GETBIT cb:bitmap 42137` — read box #42137
- `BITCOUNT cb:bitmap` — count all checked boxes
- All O(1) for SETBIT/GETBIT

**Atomic toggle — why Lua?**  
A simple read-then-write is a race condition:

```
User A: GETBIT → 0
User B: GETBIT → 0         ← both read 0 at the same time
User A: SETBIT → 1
User B: SETBIT → 1         ← both set to 1, A's toggle was lost
```

A Lua script runs atomically on Redis — no other command can run between its steps:

```lua
local bit = redis.call('GETBIT', KEYS[1], ARGV[1])
local newBit = 1 - bit          -- flip
redis.call('SETBIT', KEYS[1], ARGV[1], newBit)
return newBit
```

**Loading initial state:**  
On page load, the client fetches `GET /api/checkboxes` which returns the raw 125 KB binary buffer as `application/octet-stream`. The client wraps it in a `Uint8Array` and uses it directly. No JSON parsing overhead.

---

### 5. Redis Pub/Sub: Multi-instance broadcast

When running multiple server instances (e.g. behind a load balancer), each instance has its own pool of WebSocket clients. A toggle on server A needs to reach clients connected to server B.

```
              ┌─────────────┐     ┌─────────────┐
User on WS A  │  Server A   │     │  Server B   │  User on WS B
──────────────►  toggle()   │     │             │
              │  broadcast  ├────►│ PUBLISH     │
              │  local WS   │     │   cb:updates│
              └─────────────┘     └──────┬──────┘
                                         │
                             Redis ◄─────┘
                               │
                  ┌────────────┴────────────┐
                  │  All subscribers receive │
                  │  the message             │
                  └────────────┬────────────┘
                               │
                        Server B broadcasts
                        to its local WS clients
```

Each server has two Redis clients:
- `redis` — for commands (INCR, SETBIT, etc.)
- `redisSub` — dedicated subscriber (a subscribed Redis connection cannot issue other commands)

Messages include `serverId` so a server doesn't re-broadcast its own publishes (it already did a local broadcast).

---

### 6. Rate Limiting: Custom implementation

**No external packages.** The rate limiter is built on Redis using the fixed-window counter pattern.

**How it works:**

```
Window number = floor(Date.now() / windowDurationMs)

Key = rl:{scope}:{identifier}:{windowNumber}

On each event:
  count = INCR key           ← atomic, creates key if missing
  if count == 1:
    EXPIRE key (windowDuration + 1)   ← auto-cleanup
  if count > limit:
    reject
```

Because `INCR` is atomic, two concurrent requests cannot both read 0 and both think they're within the limit.

**Two scopes:**

| Scope | Key | Limit | Window | Action on breach |
|---|---|---|---|---|
| HTTP | `rl:http:{ip}:{window}` | 200 req | 60 s | 429 response |
| WebSocket | `rl:ws:{userId}:{window}` | 5 toggles | 5 s | Error message + cooldown popup |

**Client-side cooldown popup:**  
When the server sends `{ type: "error", message: "Rate limit exceeded..." }`, the frontend shows a red popup in the bottom-right corner with a 5-second countdown. During cooldown, clicks are ignored client-side too — no point sending messages the server will reject.

---

## Redis Key Reference

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `cb:bitmap` | String (bitmap) | None | 1M checkbox states |
| `oidc:user:{email}` | String (JSON) | None | User credentials + profile |
| `oidc:sub:{sub}` | String | None | Reverse lookup: sub → email |
| `rl:http:{ip}:{window}` | String (integer) | ~61s | HTTP rate limit counter |
| `rl:ws:{userId}:{window}` | String (integer) | ~6s | WebSocket rate limit counter |

---

## API Reference

### Auth

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, name }` | Create account |
| POST | `/auth/login` | — | `{ email, password }` | Log in |
| GET | `/auth/me` | Cookie | — | Current user from session |
| GET | `/auth/userinfo` | Bearer JWT | — | OIDC UserInfo endpoint |
| POST | `/auth/logout` | Cookie | — | Clear session |

### Data

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/checkboxes` | Optional | Full bitmap as `application/octet-stream` (125 KB) |
| GET | `/api/stats` | — | `{ total: 1000000, checked: N }` |

### WebSocket Events

**Client → Server:**
```json
{ "type": "toggle", "index": 42137 }
```

**Server → Client:**
```json
{ "type": "connected",  "authenticated": true, "connectedUsers": 12 }
{ "type": "toggle",     "index": 42137, "state": 1 }
{ "type": "users",      "count": 12 }
{ "type": "error",      "message": "Rate limit exceeded — slow down!" }
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Set to `production` for secure cookies |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | — | **Required.** Long random string for signing tokens |

Copy `.env.example` to `.env` and set `JWT_SECRET` to any long random string.  
No external OAuth credentials needed.


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JavaScript — **Canvas-based** virtual grid |
| Server | Node.js + Express (ESM) |
| Real-time | `ws` — raw WebSocket server |
| State | **Redis bitmap** — 1 M bits = 125 KB |
| Pub/Sub | Redis Pub/Sub for multi-instance broadcasting |
| Auth | **Custom OIDC** — self-contained identity provider (register/login, JWT ID Tokens) |
| Rate Limiting | **Custom** — Redis fixed-window counters (no external packages) |
| Session | JWT stored in httpOnly cookie |

## Features

- **1 000 000 checkboxes** rendered on `<canvas>` with virtual scrolling (only visible cells drawn)
- **Minimap** for quick navigation across the full grid
- **Real-time sync** — toggle in one tab, see it in another instantly
- **Custom OIDC server** — register/login, JWT ID Tokens, UserInfo endpoint, no external provider needed
- **Redis bitmap** — atomic toggle via Lua script, compact storage (125 KB for 1M bits)
- **Redis Pub/Sub** — updates broadcast across multiple server instances
- **Custom rate limiting** — HTTP: 200 req/min per IP; WebSocket: 30 toggles/sec per user
- **PBKDF2 password hashing** — 100 000 iterations, SHA-512, random salt
- **Online user count** and **checked count** displayed live
- **Jump-to-index** navigation
- **Reconnecting WebSocket** with exponential backoff

## How to Run Locally

### Prerequisites

- **Node.js** ≥ 18
- **Redis** server running locally (or a remote instance)

### Redis Setup

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu / Debian
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine

# Verify
redis-cli ping    # → PONG
```

### Steps

```bash
# 1 — Clone and enter project
cd million_checkbox

# 2 — Copy env template and fill in values
cp .env.example .env

# 3 — Install dependencies
npm install

# 4 — Start
npm run dev        # dev mode (auto-restart on save)
# or
npm start          # production mode

# → http://localhost:3000
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` or `production` |
| `REDIS_URL` | Redis connection string (default `redis://localhost:6379`) |
| `JWT_SECRET` | Secret key for signing OIDC ID Tokens (JWT) |

> No external OAuth provider credentials needed — the app runs its own OIDC-style auth server.

## Architecture

### Auth Flow (Custom OIDC)

The server implements an **OpenID Connect–style** identity provider:

- **POST /auth/register** — create user (email, password, name). Password hashed via PBKDF2 (100 000 iterations, SHA-512).
- **POST /auth/login** — verify credentials, issue JWT as OIDC ID Token.
- **GET /auth/me** — cookie-based session check (returns user claims).
- **GET /auth/userinfo** — standard OIDC UserInfo endpoint (accepts `Bearer` token).
- **POST /auth/logout** — clears session cookie.

```
Browser                       Server (OIDC Provider)         Redis
  │                                  │                        │
  ├── POST /auth/register ─────────→ │                        │
  │   { email, password, name }      ├── hash password ──→    │
  │                                  ├── SET oidc:user:… ───→ │
  │                                  │                        │
  │ ←── Set-Cookie: JWT (ID Token) ──┤                        │
  │     { sub, email, name }         │                        │
  │                                  │                        │
  ├── POST /auth/login ────────────→ │                        │
  │   { email, password }            ├── GET oidc:user:… ───→ │
  │                                  │ ←── stored hash ───────┤
  │                                  ├── verify hash          │
  │ ←── Set-Cookie: JWT (ID Token) ──┤                        │
  │                                  │                        │
  ├── GET /auth/userinfo ──────────→ │                        │
  │   Authorization: Bearer <jwt>    │                        │
  │ ←── { sub, email, name } ────────┤                        │
```

- Passwords stored as PBKDF2 hash + random 32-byte salt
- JWT (httpOnly, SameSite=Lax cookie) valid for 7 days
- User records stored permanently in Redis (keys: `oidc:user:{email}`, `oidc:sub:{sub}`)
- No external provider needed — fully self-contained

### WebSocket Flow

```
Client                     Server                     Redis
  │                          │                          │
  ├── WS connect ──────────→ │                          │
  │   (cookie attached)      │── verify JWT ──→         │
  │ ←── { connected, user } ─┤                          │
  │                          │                          │
  ├── { toggle, index } ───→ │                          │
  │                          ├── rate limit check ────→ │  INCR rl:ws:…
  │                          ├── EVAL toggle lua ─────→ │  GETBIT + SETBIT
  │                          │ ←── newState ────────────┤
  │                          │                          │
  │ ←── { toggle, index, state } ── broadcast to all   │
  │                          ├── PUBLISH cb:updates ──→ │
  │                          │                          │ ─→ other servers
```

### Redis Key Structure

| Key Pattern | Type | Purpose |
|---|---|---|
| `cb:bitmap` | String (bitmap) | 1 M checkbox states — each bit = one checkbox |
| `rl:http:{ip}:{window}` | String (counter) | HTTP rate limit counter per IP per time window |
| `rl:ws:{userId}:{window}` | String (counter) | WebSocket rate limit counter per user per second |
| `user:{sub}` | String (JSON) | Cached user profile from Google OIDC |

### Rate Limiting Logic

**Strategy:** Fixed-window counter using Redis `INCR` + `EXPIRE`.

```
Key = rl:{scope}:{identifier}:{windowNumber}

windowNumber = Math.floor(Date.now() / (windowSizeMs))

On each request:
  count = INCR key
  if count == 1 → EXPIRE key (windowSize + 1s buffer)
  if count > limit → reject (429 / error message)
```

| Scope | Identifier | Limit | Window |
|---|---|---|---|
| HTTP | Client IP | 200 requests | 60 seconds |
| WebSocket | User ID (`sub`) | 30 toggles | 1 second |

No external rate-limit packages are used. The limiter is implemented in `src/middleware/rateLimiter.js` using raw Redis commands.

### Checkbox State Storage

- **Redis bitmap** at key `cb:bitmap` — 1 000 000 bits = 125 000 bytes
- `SETBIT` / `GETBIT` for O(1) per-checkbox operations
- `BITCOUNT` for total checked count
- **Atomic toggle** via Lua script: `GETBIT → flip → SETBIT` in a single Redis eval
- Full bitmap served over HTTP (`GET /api/checkboxes`) for initial page load (~125 KB, compresses well)

### Frontend Rendering

- **Canvas-based** — no DOM elements for checkboxes
- Only cells visible in the scroll viewport are rendered each frame
- 1000×1000 grid with 16 px cells → 16 000×16 000 px virtual area
- Scroll container with sticky canvas overlay
- `requestAnimationFrame` batching for smooth updates
- **Minimap** (200×200 canvas) shows density heatmap of entire grid
- Hover highlighting and checkmark rendering for checked cells

## Project Structure

```
million_checkbox/
├── .env.example              Environment variable template
├── .gitignore
├── package.json
├── server.js                 Entry point — Express + WS + Redis
├── README.md
├── public/                   Static frontend files
│   ├── index.html            Main page
│   ├── style.css             Dark theme styling
│   └── app.js                Canvas grid, WebSocket client, auth UI
└── src/
    ├── config/
    │   └── redis.js           Redis client factory (ioredis)
    ├── middleware/
    │   ├── auth.js            JWT create / verify / middleware
    │   └── rateLimiter.js     Custom rate limiter (HTTP + WS)
    ├── routes/
    │   ├── auth.routes.js     Google OAuth 2.0 OIDC flow
    │   └── api.routes.js      GET /api/checkboxes, GET /api/stats
    ├── services/
    │   ├── checkbox.js        Redis bitmap operations + Lua toggle
    │   └── pubsub.js          Redis Pub/Sub publish + subscribe
    └── socket/
        └── handler.js         WebSocket connection & event handling
```

```
server.js      HTTP + WebSocket server, shared grid state
index.html     Full UI — modal, navbar, grid, WS client logic
style.css      All styles — CSS variables, no framework
package.json
```

---

## How it works

### 1. Color selection (modal)

When the page loads, a full-screen modal blocks the grid. The user must pick a color before they can interact.

- **12 preset swatches** — 4 warm pastels, 4 cool blues/purples, 4 deep-to-light teals
- **Custom color picker** — native `<input type="color">` for any hex
- **Live preview chip** — updates as you hover/pick, shows the hex value
- **Confirm button** — disabled until a color is chosen; background takes on the chosen color with auto text-contrast (light/dark detection via luminance formula)
- On confirm: `myColor` is set, modal hides, grid unlocks (`pointer-events` restored, blur removed)

The grid behind the modal is blurred and non-interactive (`pointer-events: none; filter: blur(4px)`) until a color is confirmed.

### 2. The grid

- 800 `<div class="box">` elements arranged in a `40-column CSS grid`
- Built using a `DocumentFragment` — all 800 elements are inserted in a single DOM operation
- Each box stores its index in `data-id`
- Click events use **event delegation** on the parent `#grid` element — one listener handles all 800 boxes via `e.target.closest(".box")`
- Hover shows a preview of `--my-color` (the CSS variable updates live as you pick)

### 3. Toggle logic

Clicking a box sends a single WebSocket message:

```json
{ "type": "toggle", "id": 42, "color": "#FF8080" }
```

The server applies this rule:

- If the box is **already that exact color** → turn it off (`null`)
- Otherwise → set it to the sent color (overrides any previous color)

The server then **broadcasts** the result to every connected client:

```json
{ "type": "update", "id": 42, "color": "#FF8080" }
```

or

```json
{ "type": "update", "id": 42, "color": null }
```

The color travels with **every message** — the server never stores a color per connection. This eliminates color sync bugs entirely: there is no separate "set color" step that could be missed or arrive out of order.

### 4. Server-side state

```
boxState[800]  — array of null | "#RRGGBB"
```

- `null` = box is off
- `"#RRGGBB"` = box is lit with that color

On new connection, the server immediately sends the full current state:

```json
{ "type": "init", "state": [ null, "#FF8080", null, ... ] }
```

The client only paints boxes where `state[id] !== null`, skipping empty entries.

### 5. Clear Grid

The **Clear Grid** button in the navbar triggers a `confirm()` dialog, then sends:

```json
{ "type": "clearGrid" }
```

The server does `boxState.fill(null)` and broadcasts:

```json
{ "type": "cleared" }
```

All clients reset every box to the off-state background instantly.

### 6. Auto-reconnect

If the WebSocket closes (server restart, network drop), the client reconnects automatically with **exponential backoff**:

- Starts at 500 ms
- Each retry multiplies delay by 1.5
- Caps at 5 000 ms

On reconnect, the server sends a fresh `init` message so the client always catches up to current state.

### 7. Connection status pill

The navbar shows a live status indicator with three states:

| State | Dot | Label |
|---|---|---|
| `connecting` | pulsing tan | "connecting…" |
| `connected` | glowing olive (animated) | "live" |
| `disconnected` | red | "offline" |

---

## Security

- **Input validation on every message** — `id` must be an integer in `[0, 799]`; `color` must match `/^#[0-9A-Fa-f]{6}$/`; anything else is silently dropped
- **Per-client rate limiting** — max 30 messages/second per connection; excess messages are dropped, preventing flood attacks
- No user input is ever written to HTML (no XSS surface)

---

## Visual design

All colors are CSS variables defined in `:root`:

| Variable | Value | Role |
|---|---|---|
| `--cream` | `#FFF8EC` | Page background |
| `--tan` | `#DCCCAC` | Navbar background |
| `--sage` | `#99AD7A` | Accent |
| `--olive` | `#546B41` | Primary accent, borders |
| `--box-off` | `#ccc0a4` | Unlit box color |
| `--my-color` | dynamic | User's chosen color (updated live) |

The navbar uses `backdrop-filter: blur(20px)` for a frosted-glass effect. Box toggle animations use the **Web Animations API** (`element.animate(...)`) — no forced reflow.

---

## WebSocket message reference

| Direction | Message | Fields |
|---|---|---|
| Server → Client | `init` | `state: (null\|string)[800]` |
| Client → Server | `toggle` | `id: number`, `color: string` |
| Server → Client | `update` | `id: number`, `color: null\|string` |
| Client → Server | `clearGrid` | — |
| Server → Client | `cleared` | — |
