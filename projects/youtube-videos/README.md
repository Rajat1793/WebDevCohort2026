# YouTube Videos — FreeAPI

A YouTube-style video listing UI built with **React + Vite + Tailwind CSS**, powered by the [FreeAPI](https://freeapi.app) public YouTube videos endpoint.

**Live API:** `https://api.freeapi.app/api/v1/public/youtube/videos`

---

## Features

- Responsive video grid (1 → 2 → 3 → 4 columns)
- Shimmer skeleton loading state
- Live search — filter by title or channel name
- Paginated "Load more" (12 videos per page)
- Video cards showing thumbnail, title, channel, views, likes, comments, duration & relative time
- Papaya orange (`#ff6b35`) accent throughout
- Dark mode UI with sticky glassmorphism header
- Health check endpoint at `/health` for Render

---

## Local Development

```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173/WebDevCohort2026/projects/youtube-videos/`.

---

## Production Build (local preview)

```bash
# Build the app (uses the Vite base path for GitHub Pages / subdirectory hosting)
npm run build

# Preview the production build locally
npm run preview
```

---

## Deploying to Render

### Option 1 — Auto-deploy with `render.yaml` (recommended)

1. Push this folder (or the entire repo) to a GitHub / GitLab repository.
2. Go to [render.com](https://render.com) → **New → Blueprint**.
3. Connect your repository. Render will detect `render.yaml` and create the service automatically.
4. Click **Apply** — Render will run the build and deploy.

The service is configured in [`render.yaml`](./render.yaml):

```yaml
services:
  - type: web
    name: youtube-videos
    runtime: node
    buildCommand: npm install && npm run build:server
    startCommand: npm start
    healthCheckPath: /health
```

`build:server` sets `VITE_BASE_PATH=/` so the app is served from the root path on Render (instead of the GitHub Pages subdirectory path used in development).

### Option 2 — Manual setup via Render dashboard

1. **New → Web Service** → connect your repository.
2. Set **Root Directory** to `projects/youtube-videos` (if deploying from the monorepo).
3. Configure the following:

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build:server` |
| **Start Command** | `npm start` |

4. Under **Advanced**, add the environment variable:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |

5. Click **Create Web Service**.

### Health check

Once deployed, Render will ping `GET /health` and expect:

```json
{ "status": "ok" }
```

Your live URL will be `https://<service-name>.onrender.com`.

---

## Project Structure

```
youtube-videos/
├── index.html              # HTML entry point
├── server.js               # Express server (production / Render)
├── render.yaml             # Render deployment config
├── vite.config.js          # Vite config
├── tailwind.config.js      # Tailwind config
├── postcss.config.js       # PostCSS config
├── package.json
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Root component — header, grid, state
    ├── VideoCard.jsx       # Single video card component
    └── index.css           # Tailwind directives + scrollbar styles
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 5 | Dev server & bundler |
| Tailwind CSS 3 | Utility-first styling |
| Express 5 | Production static file server |
| FreeAPI | YouTube video data source |
