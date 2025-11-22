const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getSignedUrl } = require('../services/mediaService');

// Helper para URL assinada
const populateUserUrl = async (user) => {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  if (u.avatarUrl && !u.avatarUrl.startsWith('http')) {
    u.avatarUrl = await getSignedUrl(u.avatarUrl);
  }
  // Remove hash de senha por segurança
  delete u.passwordHash;
  return u;
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (user.role !== 'admin' && user.subscriptionStatus !== 'active') {
      return res.status(403).json({ message: 'Usuário inativo ou assinatura bloqueada.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    const userResponse = await populateUserUrl(user);

    res.status(200).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkSubscription = async (req, res, next) => {
  try {
    // req.user is attached by the 'protect' middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    if (user.role !== 'admin' && user.subscriptionStatus !== 'active') {
        return res.status(403).json({ message: 'Assinatura inativa.', isSubscribed: false });
    }

    const userResponse = await populateUserUrl(user);

    res.status(200).json({
      isSubscribed: true,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};