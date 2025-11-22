const Post = require('../models/Post');
const { getSignedUrl } = require('../services/mediaService');

// Função recursiva para processar posts e comentários
const populatePostUrls = async (post) => {
  if (!post) return null;
  const p = post.toObject ? post.toObject() : post;

  // URL da imagem do Post
  if (p.imageUrl && !p.imageUrl.startsWith('http')) {
    p.imageUrl = await getSignedUrl(p.imageUrl);
  }

  // Avatar do Autor do Post
  if (p.author && p.author.avatarUrl && !p.author.avatarUrl.startsWith('http')) {
    p.author.avatarUrl = await getSignedUrl(p.author.avatarUrl);
  }

  // Avatares nos comentários
  if (p.comments && p.comments.length > 0) {
    p.comments = await Promise.all(p.comments.map(async (c) => {
      if (c.author && c.author.avatarUrl && !c.author.avatarUrl.startsWith('http')) {
        c.author.avatarUrl = await getSignedUrl(c.author.avatarUrl);
      }
      return c;
    }));
  }

  return p;
};

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatarUrl')
      .populate('comments.author', 'name avatarUrl')
      .sort({ createdAt: -1 });
    
    const postsWithUrls = await Promise.all(posts.map(populatePostUrls));
    res.status(200).json(postsWithUrls);
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  const { text, imageUrl, videoUrl } = req.body;
  try {
    let post = await Post.create({
      text,
      imageUrl, // Aqui salvamos o gcsPath vindo do frontend
      videoUrl,
      author: req.user._id,
    });
    post = await post.populate('author', 'name avatarUrl');
    const postWithUrl = await populatePostUrls(post);
    res.status(201).json(postWithUrl);
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Ação não autorizada.' });
    }
    await Post.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Post removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    const userId = req.user._id.toString();
    if (post.likes.map(id => id.toString()).includes(userId)) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    next(error);
  }
};

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
    let populatedComment = { ...createdComment.toObject() };
    
    // Mock populate for instant return, but handles avatarUrl check
    let authorAvatar = req.user.avatarUrl;
    if (authorAvatar && !authorAvatar.startsWith('http')) {
        authorAvatar = await getSignedUrl(authorAvatar);
    }

    populatedComment.author = {
        _id: req.user._id,
        name: req.user.name,
        avatarUrl: authorAvatar
    };

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

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