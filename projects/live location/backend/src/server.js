const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const authRoutes = require('./auth/routes');
const { connectDatabase } = require('./db/connection');
const { createTopic } = require('./kafka/client');
const { startSocketConsumer } = require('./kafka/socketConsumer');
const { startDbConsumer } = require('./kafka/dbConsumer');
const { setupSocketIO } = require('./socket/handler');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

async function main() {
  const app = express();
  const server = http.createServer(app);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  const sessionMiddleware = session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' },
  });
  app.use(sessionMiddleware);

  app.use('/auth', authRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // SPA fallback — serve index.html for any non-API route so React Router works
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  const io = new Server(server, {
    cors: { origin: FRONTEND_ORIGIN, credentials: true },
  });
  setupSocketIO(io, sessionMiddleware);

  await connectDatabase();

  try { await createTopic(); } catch (err) { console.error('[Kafka] Topic error:', err.message); }
  try { await startSocketConsumer(io); await startDbConsumer(); } catch (err) { console.error('[Kafka] Consumer error:', err.message); }

  server.listen(config.port, () => console.log(`[Server] Running on http://localhost:${config.port}`));

  const shutdown = async () => {
    const { disconnectProducer, socketConsumer, dbConsumer } = require('./kafka/client');
    await disconnectProducer();
    await socketConsumer.disconnect();
    await dbConsumer.disconnect();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => { console.error('[Server] Fatal error:', err); process.exit(1); });
