const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');
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

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ role: 1, createdAt: -1 });
    const usersWithUrls = await Promise.all(users.map(populateUserUrl));
    res.status(200).json(usersWithUrls);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  const { name, email, password, role = 'user', subscriptionStatus = 'active' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const lowercasedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowercasedEmail });

    if (existingUser) {
      if (existingUser.subscriptionStatus === 'deleted') {
        logger.info(`Reativando usuário previamente removido: ${lowercasedEmail}`);
        existingUser.name = name;
        existingUser.password = password;
        existingUser.role = role;
        existingUser.subscriptionStatus = subscriptionStatus;
        const updatedUser = await existingUser.save();
        const userResponse = await populateUserUrl(updatedUser);
        await sendWelcomeEmail(lowercasedEmail, name.split(' ')[0], password);
        return res.status(200).json(userResponse);
      } else {
        return res.status(409).json({ message: 'Este email já está cadastrado.' });
      }
    }

    const user = new User({
      name,
      email: lowercasedEmail,
      role,
      subscriptionStatus,
    });
    user.password = password;

    const savedUser = await user.save();
    const userResponse = await populateUserUrl(savedUser);

    await sendWelcomeEmail(lowercasedEmail, name.split(' ')[0], password);

    res.status(201).json(userResponse);
    
  } catch (error) {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: `O email '${email}' já está cadastrado.` });
    }
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
    const { name, email, role, subscriptionStatus, avatarUrl } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (email && email.toLowerCase() !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(409).json({ message: 'Este email já está em uso por outro usuário.' });
            }
            if (!user.kiwifyEmail) {
                user.kiwifyEmail = user.email;
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
        if (avatarUrl) user.avatarUrl = avatarUrl; // Salva o gcsPath
        
        const updatedUser = await user.save();
        const userResponse = await populateUserUrl(updatedUser);
        
        res.status(200).json(userResponse);
    } catch (error) {
        next(error);
    }
};

exports.changeUserPassword = async (req, res, next) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha é obrigatória e deve ter pelo menos 6 caracteres.' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Não é possível excluir um administrador.' });
    }
    user.subscriptionStatus = 'deleted';
    await user.save();
    const userResponse = await populateUserUrl(user);
    res.status(200).json({ message: 'Usuário removido com sucesso.', user: userResponse });
  } catch (error) {
    next(error);
  }
};

exports.restoreUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    if (user.subscriptionStatus !== 'deleted') {
      return res.status(400).json({ message: 'Este usuário não está removido.' });
    }
    user.subscriptionStatus = 'inactive';
    await user.save();
    const userResponse = await populateUserUrl(user);
    res.status(200).json({ message: 'Usuário restaurado com sucesso.', user: userResponse });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'blocked'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    user.subscriptionStatus = status;
    await user.save();
    const userResponse = await populateUserUrl(user);
    res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};