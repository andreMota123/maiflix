const AdminPost = require('../models/AdminPost');

// @desc    Get all admin posts
// @route   GET /api/admin-posts
// @access  Private
exports.getAllAdminPosts = async (req, res, next) => {
  try {
    const posts = await AdminPost.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new admin post
// @route   POST /api/admin-posts
// @access  Private/Admin
exports.createAdminPost = async (req, res, next) => {
  const { title, content, imageUrl, videoUrl } = req.body;
  try {
    const post = await AdminPost.create({ title, content, imageUrl, videoUrl });
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an admin post
// @route   PUT /api/admin-posts/:id
// @access  Private/Admin
exports.updateAdminPost = async (req, res, next) => {
  try {
    const post = await AdminPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an admin post
// @route   DELETE /api/admin-posts/:id
// @access  Private/Admin
exports.deleteAdminPost = async (req, res, next) => {
  try {
    const post = await AdminPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    await AdminPost.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Post removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};
