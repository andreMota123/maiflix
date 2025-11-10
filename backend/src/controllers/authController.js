const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Admin users bypass the subscription status check
    if (user.role !== 'admin' && user.subscriptionStatus !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // Ensure password is not sent in the response
    user.password = undefined;

    res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento de erros
  }
};

exports.checkSubscription = async (req, res, next) => {
  try {
    // O ID do usuário vem do middleware de autenticação (req.user)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Admin users are always considered "subscribed"
    if (user.role !== 'admin' && user.subscriptionStatus !== 'active') {
        return res.status(403).json({ message: 'Assinatura inativa.', isSubscribed: false });
    }

    res.status(200).json({
      isSubscribed: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};