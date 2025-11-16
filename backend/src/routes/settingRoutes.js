const express = require('express');
const router = express.Router();
const {
  getSettings,
  upsertSetting,
} = require('../controllers/settingController');

const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, getSettings);
router.post('/', protect, admin, upsertSetting);

module.exports = router;
