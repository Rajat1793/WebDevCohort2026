import dotenv from 'dotenv';
import crypto from 'crypto';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from the project directory regardless of where node is invoked from
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cookieParser from 'cookie-parser';
import { createRedisClient } from './src/config/redis.js';
import { authRouter } from './src/routes/auth.routes.js';
import { apiRouter } from './src/routes/api.routes.js';
import { httpRateLimiter } from './src/middleware/rateLimiter.js';
import { setupWebSocket } from './src/socket/handler.js';
import { subscribeToPubSub } from './src/services/pubsub.js';

const PORT = process.env.PORT || 3000;
const SERVER_ID = crypto.randomUUID();

// ── Redis clients (one for commands, one for Pub/Sub subscriber) ──
const redis = createRedisClient();
const redisSub = createRedisClient();

// ── Express ───────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(httpRateLimiter(redis));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRouter());
app.use('/api', apiRouter(redis));

// ── HTTP + WebSocket server ───────────────────────────────────────
const server = http.createServer(app);
const { broadcast } = setupWebSocket(server, redis, SERVER_ID);

// ── Redis Pub/Sub (cross-instance broadcast) ─────────────────────
subscribeToPubSub(redisSub, SERVER_ID, broadcast);

server.listen(PORT, () => {
  console.log(`Million Checkboxes → http://localhost:${PORT}`);
});
