const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. Busca o usuário e inclui a senha (que por padrão é oculta).
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // 2. Verifica se o usuário existe e se a senha corresponde.
    // O 'await' aqui é crucial, pois user.comparePassword (usando bcryptjs) retorna uma promessa.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Verifica a assinatura (admins pulam esta verificação).
    if (user.role !== 'admin' && user.subscriptionStatus !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    // 4. Cria o token JWT.
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 5. Remove a senha do objeto antes de enviar a resposta.
    user.password = undefined;

    // 6. Envia o token e os dados do usuário.
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
    
    // Usuários administradores são sempre considerados "inscritos"
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
