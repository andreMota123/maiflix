const AdminPost = require('../models/AdminPost');
const { getSignedUrl } = require('../services/mediaService');

const populateAdminPostUrl = async (post) => {
  if (!post) return null;
  const p = post.toObject ? post.toObject() : post;
  if (p.imageUrl && !p.imageUrl.startsWith('http')) {
    p.imageUrl = await getSignedUrl(p.imageUrl);
  }
  return p;
};

exports.getAllAdminPosts = async (req, res, next) => {
  try {
    const posts = await AdminPost.find().sort({ createdAt: -1 });
    const postsWithUrls = await Promise.all(posts.map(populateAdminPostUrl));
    res.status(200).json(postsWithUrls);
  } catch (error) {
    next(error);
  }
};

exports.createAdminPost = async (req, res, next) => {
  const { title, content, imageUrl, videoUrl } = req.body;
  try {
    const post = await AdminPost.create({ title, content, imageUrl, videoUrl });
    const postWithUrl = await populateAdminPostUrl(post);
    res.status(201).json(postWithUrl);
  } catch (error) {
    next(error);
  }
};

exports.updateAdminPost = async (req, res, next) => {
  try {
    const post = await AdminPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    const postWithUrl = await populateAdminPostUrl(post);
    res.status(200).json(postWithUrl);
  } catch (error) {
    next(error);
  }
};

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