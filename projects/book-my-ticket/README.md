# ChaiCode Cinema

A simplified movie seat booking platform built for the **ChaiCode Hackathon**. Users can register, login and book seats for a movie. Built on top of the provided starter code by adding an authentication layer and protected booking flow.

Live demo: [ChaiCode Cinema](https://chaicode-cinema.onrender.com/)

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (hosted on Render)
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Frontend:** Vanilla JS + Tailwind CSS

---

## Features

- User registration with hashed passwords (bcryptjs)
- User login returning a JWT token
- Modular auth middleware (`middleware/auth.middleware.mjs`)
- Seat booking tied to the logged-in user — name comes from JWT, not URL
- Duplicate seat booking prevention (DB transaction + `FOR UPDATE` lock)
- Responsive seat grid UI with login/register tabs
- Auto-login on page refresh if token is still valid
- Cold start handling: `/health` endpoint, self-ping keep-alive, frontend retry loop
- DB migration and reset utility scripts
- All config via `.env` — no hardcoded values in code

---

## Project Structure

```
├── db/
│   └── pool.mjs              # pg connection pool (shared across routes)
├── middleware/
│   └── auth.middleware.mjs   # JWT authentication middleware
├── routes/
│   ├── auth.routes.mjs       # POST /register, POST /login
│   ├── seats.routes.mjs      # GET /seats, PUT /:id/:name
│   └── user.routes.mjs       # GET /me
├── index.mjs                 # App setup, route wiring, server start
├── index.html                # Frontend UI
├── migrate.mjs               # Creates tables and seeds seat data
├── reset-db.mjs              # Clears all users and resets seats
├── package.json
├── .env                      # Local environment variables (not committed)
└── .gitignore
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone the repo

```bash
git clone https://github.com/Rajat1793/BookMyTicket.git
cd BookMyTicket
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
# Server
PORT=8080
APP_URL=http://localhost:8080   # Set to your Render URL in production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10

# Seats
SEAT_COUNT=50
```

### 4. Run PostgreSQL with Docker (optional)

```bash
docker run -d \
  --name pg-bookticket \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sql_class_2_db \
  -p 5433:5432 \
  postgres:16
```

Then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/sql_class_2_db` in `.env`.

### 5. Run migrations

```bash
node migrate.mjs
```

This creates the `users` table and seeds 50 seats.

### 6. Start the server

```bash
node index.mjs
```

Open `http://localhost:8080`

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/` | No | Serves the frontend |
| `GET` | `/health` | No | Health check (used by Render) |
| `GET` | `/seats` | No | Get all seats with booking status |
| `POST` | `/register` | No | Register a new user |
| `POST` | `/login` | No | Login and receive JWT token |
| `GET` | `/me` | Yes | Get logged-in user's profile |
| `PUT` | `/:id/:name` | Yes | Book a seat (name resolved from JWT, not URL) |

### Auth Header

Protected endpoints require:
```
Authorization: Bearer <token>
```

---

## Example Usage

```bash
# Register
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{"username":"raj","email":"raj@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raj@test.com","password":"secret123"}'

# Book a seat — :name is a placeholder, real name comes from JWT
curl -X PUT http://localhost:8080/5/me \
  -H "Authorization: Bearer <your_token>"
```

---

## Database Utilities

```bash
# Create tables and seed data
node migrate.mjs

# Reset all users and unbook all seats (dry run)
node reset-db.mjs

# Reset with confirmation
node reset-db.mjs --confirm
```

---

## Deployment

Hosted on **Render** (Web Service).

**Required environment variables on Render:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Internal Render PostgreSQL URL |
| `JWT_SECRET` | A strong random secret string |
| `PORT` | `8080` |
| `APP_URL` | Your Render service URL (enables self-ping keep-alive) |
| `JWT_EXPIRES_IN` | `1h` (or `7d` etc.) |
| `BCRYPT_SALT_ROUNDS` | `10` |
| `SEAT_COUNT` | `50` |

**Build Command:** `npm install`  
**Start Command:** `node index.mjs`

> **Note:** `APP_URL` enables a self-ping every 14 minutes to prevent Render free tier spin-down. Set it to your service URL e.g. `https://bookmyticket-xxxx.onrender.com`.
