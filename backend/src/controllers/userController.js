const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all non-admin users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Reworked validation for more clarity and robustness.
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'O nome é obrigatório e não pode estar vazio.' });
  }
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ message: 'O email é obrigatório e não pode estar vazio.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'A senha é obrigatória e deve ter pelo menos 6 caracteres.' });
  }

  try {
    // Ensure email is trimmed and lowercased for consistency
    const processedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: processedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Um usuário com este email já existe.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: processedEmail,
      password: password,
      subscriptionStatus: 'active', // Assume active when created by admin
    });

    res.status(201).json(user);
  } catch (error) {
    // Specific handling for duplicate key errors (code 11000)
    if (error.code === 11000) {
      logger.warn('Falha ao criar usuário: Email duplicado.', { email: email, error: error.message });
      return res.status(409).json({ message: 'Este email já está cadastrado no sistema.' });
    }
    
    // Pass other errors to the generic handler
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  const { name, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (name && typeof name === 'string' && name.trim() !== '') {
        user.name = name.trim();
    }
    
    if (password) {
        if (typeof password === 'string' && password.length >= 6) {
            user.password = password; // The pre-save hook will hash it
        } else {
            return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
        }
    }

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Não é possível excluir um administrador.' });
    }
    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Usuário removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};


// @desc    Update user subscription status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  const { status } = req.body; // Expects 'active' or 'inactive'

  if (!['active', 'inactive', 'expired'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    user.subscriptionStatus = status;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
