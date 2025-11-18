const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all non-admin users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    // Retorna todos os usuários que não foram "removidos" (soft-deleted),
    // garantindo que a lista esteja sempre limpa.
    const users = await User.find({ subscriptionStatus: { $ne: 'deleted' } })
      .sort({ role: 1, createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user by admin
// @route   POST /api/users
// @access  Private/Admin
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
    
    // Check if a user (including soft-deleted ones) already exists with this email
    const existingUser = await User.findOne({ email: lowercasedEmail });

    if (existingUser) {
      // If the found user was soft-deleted, we can "reactivate" and update them
      if (existingUser.subscriptionStatus === 'deleted') {
        logger.info(`Reativando usuário previamente removido: ${lowercasedEmail}`);
        
        existingUser.name = name;
        existingUser.password = password; // Set password to trigger re-hashing
        existingUser.role = role;
        existingUser.subscriptionStatus = subscriptionStatus; // "Undelete" user
        
        const updatedUser = await existingUser.save();
        
        const userResponse = updatedUser.toObject();
        delete userResponse.passwordHash;

        // Return 200 OK because it was an update/reactivation, not a creation
        return res.status(200).json(userResponse);
      } else {
        // If the user exists and is NOT deleted, then it's a true duplicate.
        return res.status(409).json({ message: 'Este email já está cadastrado.' });
      }
    }

    // If no user exists at all with this email, create a new one.
    const user = new User({
      name,
      email: lowercasedEmail,
      role,
      subscriptionStatus,
    });
    // Use the virtual setter to trigger the pre-save password hashing hook
    user.password = password;

    const savedUser = await user.save();
    
    const userResponse = savedUser.toObject();
    delete userResponse.passwordHash;

    res.status(201).json(userResponse);
    
  } catch (error) {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    // Pass other errors to the generic error handler
    next(error);
  }
};


// @desc    Update a user's details (name, email, role, status)
// @route   PATCH /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    const { name, email, role, subscriptionStatus } = req.body;
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
            user.email = email;
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
        
        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.passwordHash;
        
        res.status(200).json(userResponse);
    } catch (error) {
        next(error);
    }
};

// @desc    Change a user's password
// @route   PATCH /api/users/:id/password
// @access  Private/Admin
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
        user.password = newPassword; // Use the virtual setter
        await user.save();
        res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } catch (error) {
        next(error);
    }
};

// @desc    Soft delete a user
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
    
    user.subscriptionStatus = 'deleted';
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(200).json({ message: 'Usuário removido com sucesso.', user: userResponse });
  } catch (error) {
    next(error);
  }
};


// @desc    Update user subscription status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  const { status } = req.body;

  if (!['active', 'inactive', 'blocked'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido. Use "active", "inactive" ou "blocked".' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    user.subscriptionStatus = status;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.status(200).json(userResponse);
  } catch (error)
{
    next(error);
  }
};