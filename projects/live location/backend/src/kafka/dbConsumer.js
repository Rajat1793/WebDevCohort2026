const config = require('../config');
const { dbConsumer } = require('./client');
const LocationHistory = require('../db/LocationHistory');

const recentEvents = new Map();
const DEDUP_WINDOW_MS = 2000;

async function startDbConsumer() {
  await dbConsumer.connect();
  console.log('[Kafka] DB consumer connected');

  await dbConsumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });

  const batch = [];
  const BATCH_SIZE = 50;
  const BATCH_INTERVAL_MS = 5000;

  async function flushBatch() {
    if (batch.length === 0) return;
    const toInsert = batch.splice(0, batch.length);
    try {
      await LocationHistory.insertMany(toInsert, { ordered: false });
      console.log(`[Kafka-DB] Batch inserted ${toInsert.length} records`);
    } catch (err) {
      console.error('[Kafka-DB] Batch insert error:', err.message);
    }
  }

  setInterval(flushBatch, BATCH_INTERVAL_MS);

  await dbConsumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        if (!event.userId || !event.latitude || !event.longitude) return;

        const lastTime = recentEvents.get(event.userId);
        if (lastTime && event.timestamp - lastTime < DEDUP_WINDOW_MS) return;
        recentEvents.set(event.userId, event.timestamp);

        batch.push({
          userId: event.userId,
          displayName: event.displayName,
          latitude: event.latitude,
          longitude: event.longitude,
          timestamp: new Date(event.timestamp),
        });

        if (batch.length >= BATCH_SIZE) await flushBatch();
      } catch (err) {
        console.error('[Kafka-DB] Error processing message:', err.message);
      }
    },
  });

  console.log('[Kafka] DB consumer running (batched writes)');

  setInterval(() => {
    const now = Date.now();
    for (const [userId, ts] of recentEvents) {
      if (now - ts > 60000) recentEvents.delete(userId);
    }
  }, 30000);
}

module.exports = { startDbConsumer };
