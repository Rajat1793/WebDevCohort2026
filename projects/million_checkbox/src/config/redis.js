import Redis from 'ioredis';

export function createRedisClient() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });

  client.on('error', (err) => console.error('Redis error:', err.message));
  return client;
}
