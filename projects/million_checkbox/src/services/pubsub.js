/**
 * Redis Pub/Sub for broadcasting checkbox updates across server instances.
 *
 * When one server toggles a checkbox it publishes to the `cb:updates` channel.
 * Every other server receives the message and pushes the update to its
 * local WebSocket clients, giving consistent real-time state everywhere.
 *
 * Each server has a unique SERVER_ID so it can ignore its own publishes
 * (it already broadcast the update locally before publishing).
 */

const CHANNEL = 'cb:updates';

export function publishToggle(redis, index, state, userId, serverId) {
  redis.publish(CHANNEL, JSON.stringify({ index, state, userId, serverId }));
}

export function subscribeToPubSub(redisSub, serverId, broadcast) {
  redisSub.subscribe(CHANNEL, (err) => {
    if (err) console.error('Pub/Sub subscribe error:', err);
    else console.log('Subscribed to cb:updates channel');
  });

  redisSub.on('message', (channel, message) => {
    if (channel !== CHANNEL) return;
    try {
      const data = JSON.parse(message);
      // Skip messages originating from this server (already broadcast locally)
      if (data.serverId === serverId) return;
      broadcast({ type: 'toggle', index: data.index, state: data.state });
    } catch {
      // ignore malformed messages
    }
  });
}
