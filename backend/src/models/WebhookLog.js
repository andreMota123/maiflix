const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['Kiwify'],
    default: 'Kiwify',
  },
  customerEmail: {
    type: String,
    trim: true,
    index: true,
  },
  event: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['processed', 'failed', 'received'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);
module.exports = WebhookLog;