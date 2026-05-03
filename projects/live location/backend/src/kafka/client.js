const { Kafka } = require('kafkajs');
const config = require('../config');

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  retry: { initialRetryTime: 300, retries: 10 },
});

const producer = kafka.producer();
const socketConsumer = kafka.consumer({ groupId: 'socket-broadcast-group' });
const dbConsumer = kafka.consumer({ groupId: 'db-processor-group' });

let isProducerConnected = false;

async function connectProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log('[Kafka] Producer connected');
  }
}

async function disconnectProducer() {
  if (isProducerConnected) {
    await producer.disconnect();
    isProducerConnected = false;
  }
}

async function publishLocationUpdate(locationEvent) {
  await connectProducer();
  await producer.send({
    topic: config.kafka.topic,
    messages: [{ key: locationEvent.userId, value: JSON.stringify(locationEvent) }],
  });
}

async function createTopic() {
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  if (!topics.includes(config.kafka.topic)) {
    await admin.createTopics({
      topics: [{ topic: config.kafka.topic, numPartitions: 3, replicationFactor: 1 }],
    });
    console.log(`[Kafka] Topic "${config.kafka.topic}" created`);
  }
  await admin.disconnect();
}

module.exports = { kafka, producer, socketConsumer, dbConsumer, connectProducer, disconnectProducer, publishLocationUpdate, createTopic };
