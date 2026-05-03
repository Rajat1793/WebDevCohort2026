const config = require('../config');
const { socketConsumer } = require('./client');

async function startSocketConsumer(io) {
  await socketConsumer.connect();
  console.log('[Kafka] Socket consumer connected');

  await socketConsumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });

  await socketConsumer.run({
    eachMessage: async ({ message }) => {
      try {
        const locationEvent = JSON.parse(message.value.toString());
        if (!locationEvent.userId || !locationEvent.latitude || !locationEvent.longitude) return;
        io.emit('location:update', {
          userId: locationEvent.userId,
          displayName: locationEvent.displayName,
          avatar: locationEvent.avatar,
          latitude: locationEvent.latitude,
          longitude: locationEvent.longitude,
          timestamp: locationEvent.timestamp,
        });
      } catch (err) {
        console.error('[Kafka-Socket] Error processing message:', err.message);
      }
    },
  });

  console.log('[Kafka] Socket consumer running');
}

module.exports = { startSocketConsumer };
