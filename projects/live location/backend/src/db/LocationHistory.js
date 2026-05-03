const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
locationHistorySchema.index({ userId: 1, timestamp: -1 });

// TTL index: auto-delete records older than 7 days
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
