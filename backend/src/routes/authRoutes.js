const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.get('/check-subscription', protect, authController.checkSubscription);

module.exports = router;
