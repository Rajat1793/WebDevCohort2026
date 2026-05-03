# GeoLink

> Real-time location sharing — authenticated users broadcast their GPS coordinates and track each other live on an interactive map.

---

## Features

- **Live map** — Leaflet map with smooth-moving markers and permanent name labels
- **Real-time sharing** — GPS coordinates broadcast every 3 seconds via Socket.IO
- **Dual pipeline** — Direct Socket.IO broadcast for instant delivery + Kafka for durable persistence
- **Kafka consumer groups** — `socket-broadcast-group` (live relay) + `db-processor-group` (batched MongoDB writes)
- **Location history** — MongoDB stores tracks with a 7-day TTL
- **Custom OIDC auth** — Self-hosted OpenID Connect server (oidc-provider v7); no Google, no Clerk
- **Reusable OIDC server** — Standalone `oidc-server/` project; point any app at it by env var, no UI changes needed
- **Zero-framework frontend** — Pure vanilla HTML/CSS/JS, no build step required
- **Dark UI** — Minimalist dark design system (Manrope + Playfair Display + JetBrains Mono)

---

## Architecture

```
Browser (Vanilla JS + Leaflet)
    │
    ├── HTTP  → Express backend (:3001)
    │               ├── /auth/login    → PKCE redirect to OIDC server
    │               ├── /auth/callback → Code exchange, session store
    │               ├── /auth/me       → Returns session user
    │               └── /auth/logout   → Destroys session + OIDC end_session
    │
    └── WS    → Socket.IO
                    │
                    ├── Direct broadcast: socket.broadcast.emit  (instant)
                    │
                    └── Kafka producer → topic: location-updates
                                │
                    ┌───────────┴──────────┐
                    ▼                      ▼
            socket-broadcast-group   db-processor-group
            (re-broadcast to all)    (batch → MongoDB, 2s dedup)

GeoLink OIDC Auth Server (:3000)
    ├── /interaction/:uid     → login / register / consent UI
    ├── /session/end          → RP-initiated logout (id_token_hint)
    └── /.well-known/openid-configuration

Standalone OIDC Server (:4000)          ← reusable, app-agnostic
    ├── clients configured via config/clients.json
    ├── users  configured via config/users.json
    └── drop-in replacement for any project

Infrastructure (Docker Compose)
    ├── Kafka + Zookeeper (Confluent 7.5.0)
    └── MongoDB 7.0
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JS, Leaflet 1.9.4, Socket.IO Client 4.7.2 |
| Backend | Node.js, Express 4, Socket.IO 4.7.2, KafkaJS, openid-client v5 |
| Auth Server | Node.js, oidc-provider 7.14.3, EJS views |
| Standalone OIDC | Node.js, oidc-provider 7.14.3, EJS views (app-agnostic) |
| Database | MongoDB 7.0, Mongoose |
| Message Queue | Apache Kafka (Confluent 7.5.0) |
| Infrastructure | Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker + Docker Compose

### 1. Start Infrastructure

```bash
docker-compose up -d
```

Starts Zookeeper, Kafka, and MongoDB.

### 2. Auth Server

```bash
cd auth-server
npm install
npm start
```

Runs on **http://localhost:3000**

```env
PORT=3000
ISSUER=http://localhost:3000
COOKIE_SECRET=your-random-secret-min-32-chars
OIDC_CLIENT_ID=live-location-app
OIDC_CLIENT_SECRET=live-location-secret
OIDC_REDIRECT_URI=http://localhost:3001/auth/callback
```

### 3. Backend

```bash
cd backend
npm install
npm start
```

Runs on **http://localhost:3001**

```env
PORT=3001
SESSION_SECRET=your-random-secret
OIDC_ISSUER_URL=http://localhost:3000
OIDC_CLIENT_ID=live-location-app
OIDC_CLIENT_SECRET=live-location-secret
OIDC_CALLBACK_URL=http://localhost:3001/auth/callback
MONGODB_URI=mongodb://localhost:27017/live-location
KAFKA_BROKERS=localhost:9092
```

Open **http://localhost:3001** — the frontend is served statically from `backend/public/`.

---

## Standalone OIDC Server (optional)

A separate reusable OIDC server you can point **any** project at without touching its UI.

```bash
cd oidc-server
cp .env.example .env    # set COOKIE_SECRET
npm install
npm start               # http://localhost:4000
```

Add a client app by editing `config/clients.json` and restarting. Users are managed in `config/users.json` (auto-updated when someone registers).

Point any app at it:
```env
OIDC_ISSUER_URL=http://localhost:4000
OIDC_CLIENT_ID=my-app
OIDC_CLIENT_SECRET=my-app-secret
```

See [oidc-server/README.md](oidc-server/README.md) for full documentation.

---

## Demo Accounts

| Username | Password |
|---|---|
| alice | password123 |
| bob | password123 |
| charlie | password123 |

New accounts can be registered from the login screen.

---

## How Location Sharing Works

1. Click **Start Sharing** — browser prompts for GPS permission
2. Your coordinates are sent to the backend every **3 seconds** via Socket.IO
3. Backend immediately re-broadcasts your position to all connected users
4. Simultaneously publishes to Kafka for durable storage
5. Your marker appears on everyone's map in real time with your name
6. Click **Stop Sharing** to go offline (marker removed from all maps instantly)

---

## Design System

Dark-only UI. No build step, no framework.

| Token | Value |
|---|---|
| Background | `#090e0f` |
| Surface | `#0f1a1b` |
| Surface elevated | `#162022` |
| Primary | `#35858e` |
| Accent | `#7da78c` |
| Highlight | `#c2d099` |
| Font sans | Manrope |
| Font serif | Playfair Display (italic headings) |
| Font mono | JetBrains Mono (labels, badges, buttons) |

---

## Project Structure

```
live location/
├── auth-server/          # GeoLink OIDC provider (app-specific)
│   └── src/
│       ├── server.js
│       ├── oidc/         # provider config, accounts, adapter
│       ├── routes/       # interaction routes (login/register/consent)
│       └── views/        # EJS templates (dark geolink theme)
├── backend/              # Express + Socket.IO + Kafka
│   ├── public/           # index.html — full vanilla JS frontend
│   └── src/
│       ├── server.js
│       ├── auth/         # OIDC client routes + session management
│       ├── socket/       # Socket.IO handler
│       ├── kafka/        # producer + two consumer groups
│       ├── db/           # Mongoose models (location history, TTL)
│       └── config/
├── oidc-server/          # Standalone reusable OIDC server
│   ├── config/
│   │   ├── clients.json  # registered client apps
│   │   └── users.json    # user accounts
│   └── src/
│       ├── server.js
│       ├── provider.js
│       ├── accounts.js
│       ├── adapter.js
│       ├── routes/
│       └── views/        # EJS templates (dark geolink theme)
└── docker-compose.yml
```
