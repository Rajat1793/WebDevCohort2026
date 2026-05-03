const { publishLocationUpdate } = require('../kafka/client');

const connectedUsers = new Map();
const STALE_THRESHOLD_MS = 60000;

function setupSocketIO(io, sessionMiddleware) {
  io.use((socket, next) => { sessionMiddleware(socket.request, {}, next); });

  io.use((socket, next) => {
    const user = socket.request.session?.user;
    if (!user) return next(new Error('Authentication required'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] Connected: ${user.displayName} (${user.id})`);

    connectedUsers.set(user.id, {
      socketId: socket.id,
      displayName: user.displayName,
      avatar: user.avatar,
      lastSeen: Date.now(),
    });

    const activeUsers = Array.from(connectedUsers, ([userId, d]) => ({ userId, ...d }));
    socket.emit('users:active', activeUsers);
    io.emit('user:connected', { userId: user.id, displayName: user.displayName, avatar: user.avatar });

    socket.on('location:send', async (data) => {
      try {
        const { latitude, longitude } = data;
        if (
          typeof latitude !== 'number' || typeof longitude !== 'number' ||
          latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
        ) {
          socket.emit('error:validation', { message: 'Invalid location coordinates' });
          return;
        }

        const userEntry = connectedUsers.get(user.id);
        if (userEntry) userEntry.lastSeen = Date.now();

        const locationEvent = {
          userId: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          latitude,
          longitude,
          timestamp: Date.now(),
        };

        socket.broadcast.emit('location:update', locationEvent);
        await publishLocationUpdate(locationEvent);
      } catch (err) {
        console.error('[Socket] Error publishing location:', err.message);
        socket.emit('error:server', { message: 'Failed to process location update' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${user.displayName} (${reason})`);
      connectedUsers.delete(user.id);
      io.emit('user:disconnected', { userId: user.id });
    });
  });

  setInterval(() => {
    const now = Date.now();
    for (const [userId, userData] of connectedUsers) {
      if (now - userData.lastSeen > STALE_THRESHOLD_MS) {
        connectedUsers.delete(userId);
        io.emit('user:disconnected', { userId });
      }
    }
  }, 30000);
}

module.exports = { setupSocketIO };
