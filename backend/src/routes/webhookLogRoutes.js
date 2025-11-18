const express = require('express');
const router = express.Router();
const webhookLogController = require('../controllers/webhookLogController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, admin, webhookLogController.getLogs);

module.exports = router;
