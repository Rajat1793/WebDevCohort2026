# Million Checkbox

Real-time collaborative grid. 800 boxes, every click syncs live across all open tabs.

## Stack

- Node.js + Express — serves static files
- `ws` — WebSocket server on the same HTTP port
- No build step, no framework, no database

## Run

```bash
npm install
npm start          # → http://localhost:3001
```

```bash
PORT=8080 npm start   # custom port
```

## How it works

1. Open the page → pick a color in the modal
2. Click any box to toggle it on (your color) or off
3. Every other connected client sees the update instantly
4. **Clear Grid** resets all boxes for everyone

Color is sent with every click message — no separate color-sync step, no state drift.

## Project structure

```
server.js      HTTP + WebSocket server, in-memory grid state
index.html     UI — modal, grid, WebSocket client
style.css      All styles (CSS variables, no framework)
package.json
```
