const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 3001,
  sessionSecret: process.env.SESSION_SECRET || 'fallback-secret',
  oidc: {
    issuerUrl: process.env.OIDC_ISSUER_URL || 'http://localhost:3000',
    clientId: process.env.OIDC_CLIENT_ID || 'live-location-app',
    clientSecret: process.env.OIDC_CLIENT_SECRET || 'live-location-secret',
    callbackUrl: process.env.OIDC_CALLBACK_URL || 'http://localhost:3001/auth/callback',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'live-location-server',
    topic: process.env.KAFKA_TOPIC || 'location-updates',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/live-location',
  },
};
