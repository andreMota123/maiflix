const Post = require('../models/Post');

// @desc    Get all community posts
// @route   GET /api/posts
// @access  Private
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatarUrl')
      .populate('comments.author', 'name avatarUrl')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  const { text, imageUrl, videoUrl } = req.body;
  try {
    let post = await Post.create({
      text,
      imageUrl,
      videoUrl,
      author: req.user._id,
    });
    post = await post.populate('author', 'name avatarUrl');
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    // Check if user is the author or an admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }
    await Post.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Post removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    const userId = req.user._id.toString();
    if (post.likes.map(id => id.toString()).includes(userId)) {
      // Unlike
      post.likes.pull(req.user._id);
    } else {
      // Like
      post.likes.push(req.user._id);
    }
    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.addComment = async (req, res, next) => {
  const { text } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    const newComment = {
      text,
      author: req.user._id,
    };
    post.comments.push(newComment);
    await post.save();
    const createdComment = post.comments[post.comments.length - 1];
    
    // Manually populate author for the new comment to return it immediately
    const populatedComment = { ...createdComment.toObject() };
    populatedComment.author = {
        _id: req.user._id,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl
    };

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Check for new posts since a given timestamp
// @route   GET /api/posts/check-new
// @access  Private
exports.checkNewPosts = async (req, res, next) => {
  const { since } = req.query;
  if (!since) {
    return res.status(400).json({ message: 'O parâmetro "since" é obrigatório.' });
  }
  try {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate)) {
      return res.status(400).json({ message: 'Formato de data inválido para "since".' });
    }
    const count = await Post.countDocuments({ createdAt: { $gt: sinceDate } });
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};