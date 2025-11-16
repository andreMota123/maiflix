const express = require('express');
const router = express.Router();
const {
  getAllAdminPosts,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
} = require('../controllers/adminPostController');

const { protect, admin } = require('../middlewares/authMiddleware');

// Public route to get posts
router.get('/', protect, getAllAdminPosts);

// Admin-only routes
router.post('/', protect, admin, createAdminPost);
router.put('/:id', protect, admin, updateAdminPost);
router.delete('/:id', protect, admin, deleteAdminPost);

module.exports = router;
