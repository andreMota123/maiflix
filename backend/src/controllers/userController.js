const User = require('../models/User');

// @desc    Get all non-admin users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ papel: 'user' }).sort({ createdAt: -1 });
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
  try {
    const userExists = await User.findOne({ 'e-mail': email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário com este email já existe.' });
    }
    const user = await User.create({
      name,
      'e-mail': email,
      senha: password, // Password will be hashed by pre-save hook
      statusAssinatura: 'active', // Assume active when created by admin
    });
    res.status(201).json(user);
  } catch (error) {
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
    user.name = name || user.name;
    if (password) {
      user.senha = password; // The pre-save hook will hash it
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
    if (user.papel === 'admin') {
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
    user.statusAssinatura = status;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
