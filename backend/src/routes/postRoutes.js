const express = require('express');
const router = express.Router();
const {
  getAllPosts,
  createPost,
  deletePost,
  likePost,
  addComment,
  checkNewPosts
} = require('../controllers/postController');

const { protect } = require('../middlewares/authMiddleware');

// All routes in this file are protected
router.use(protect);

router.route('/')
  .get(getAllPosts)
  .post(createPost);

router.get('/check-new', checkNewPosts);

router.route('/:id')
  .delete(deletePost);

router.put('/:id/like', likePost);
router.post('/:id/comment', addComment);

module.exports = router;