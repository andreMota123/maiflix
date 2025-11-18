const WebhookLog = require('../models/WebhookLog');

// @desc    Get all webhook logs
// @route   GET /api/webhook-logs
// @access  Private/Admin
exports.getLogs = async (req, res, next) => {
  try {
    const logs = await WebhookLog.find().sort({ createdAt: -1 }).limit(100); // Limit to last 100 for performance
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};
