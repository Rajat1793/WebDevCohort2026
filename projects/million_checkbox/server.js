import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const TOTAL = 800;
const boxState = new Array(TOTAL).fill(null); // null = off, "#RRGGBB" = color

const app = express();
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  // Send current state to the new client
  ws.send(JSON.stringify({ type: "init", state: boxState }));

  // Rate limit: max 30 messages per second per client
  let msgCount = 0;
  const rateClock = setInterval(() => { msgCount = 0; }, 1000);
  ws.on("close", () => clearInterval(rateClock));

  ws.on("message", (raw) => {
    if (++msgCount > 30) return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // toggle: { type, id, color }
    // color is the user's chosen color, sent from client on every click
    if (msg.type === "toggle") {
      const id = Number(msg.id);
      if (!Number.isInteger(id) || id < 0 || id >= TOTAL) return;
      if (typeof msg.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(msg.color)) return;

      const color = msg.color;
      // If box is already this user's color → turn off, otherwise → turn on with this color
      boxState[id] = boxState[id] === color ? null : color;
      broadcast({ type: "update", id, color: boxState[id] });
    }

    // clearGrid: wipe everything
    if (msg.type === "clearGrid") {
      boxState.fill(null);
      broadcast({ type: "cleared" });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Million Checkbox → http://localhost:${PORT}`);
});
