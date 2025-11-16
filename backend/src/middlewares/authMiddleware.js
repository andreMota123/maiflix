const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to protect routes by verifying JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ message: 'O usuário pertencente a este token não existe mais.' });
    }

    req.user = currentUser; // Attach user to the request object
    next();
  } catch (error) {
    logger.warn('Falha na verificação do token', { token, error: error.message });
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

// Middleware to restrict access to admin users
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Rota exclusiva para administradores.' });
  }
};
