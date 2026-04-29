import { WebSocketServer } from 'ws';
import { extractUserFromCookies } from '../middleware/auth.js';
import { wsRateLimiter } from '../middleware/rateLimiter.js';
import { toggleCheckbox } from '../services/checkbox.js';
import { publishToggle } from '../services/pubsub.js';

const TOTAL = 1_000_000;

export function setupWebSocket(server, redis, serverId) {
  const wss = new WebSocketServer({ server });
  const clients = new Map(); // ws → { user, ip }

  /** Send a JSON payload to every connected client */
  function broadcast(data) {
    const msg = JSON.stringify(data);
    for (const [client] of clients) {
      if (client.readyState === client.OPEN) client.send(msg);
    }
  }

  /** Notify everyone of the current user count */
  function broadcastUserCount() {
    broadcast({ type: 'users', count: clients.size });
  }

  wss.on('connection', (ws, req) => {
    const user = extractUserFromCookies(req.headers.cookie);
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress;

    clients.set(ws, { user, ip });

    // Welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        authenticated: !!user,
        user: user ? { name: user.name, email: user.email } : null,
        connectedUsers: clients.size,
      }),
    );

    broadcastUserCount();

    // ── Message handler ──────────────────────────────────────────
    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === 'toggle') {
        // Only authenticated users can toggle
        if (!user) {
          ws.send(JSON.stringify({ type: 'error', message: 'Sign in to toggle checkboxes' }));
          return;
        }

        // Custom rate-limit check (Redis counter, 30 toggles/sec)
        const allowed = await wsRateLimiter(redis, user.sub);
        if (!allowed) {
          ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded — slow down!' }));
          return;
        }

        const index = Number(msg.index);
        if (!Number.isInteger(index) || index < 0 || index >= TOTAL) return;

        // Atomic toggle in Redis
        const newState = await toggleCheckbox(redis, index);
        if (newState === null) return;

        // Broadcast to all local clients
        broadcast({ type: 'toggle', index, state: newState });

        // Publish to other server instances via Redis Pub/Sub
        publishToggle(redis, index, newState, user.sub, serverId);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastUserCount();
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  return { broadcast, wss };
}
