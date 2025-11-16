const express = require('express');
const router = express.Router();
const {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

const { protect, admin } = require('../middlewares/authMiddleware');

// Public route to get banners
router.get('/', protect, getAllBanners);

// Admin-only routes
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.delete('/:id', protect, admin, deleteBanner);

module.exports = router;
