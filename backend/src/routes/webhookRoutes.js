const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const verifyKiwifyToken = require('../middlewares/verifyKiwifyToken');

router.post('/kiwify', verifyKiwifyToken, webhookController.handleKiwifyWebhook);

module.exports = router;
