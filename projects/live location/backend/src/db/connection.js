const mongoose = require('mongoose');
const config = require('../config');

async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('[MongoDB] Connected to database');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDatabase };
