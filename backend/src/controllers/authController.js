const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. A SOLUÇÃO: Busca o usuário pelo campo em PT ('e-mail') E carrega a senha ('+senha')
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }).select('+senha');

    // 2. VERIFICAÇÃO FINAL E SEGURA (Compara o hash)
    // O comparePassword no User.js é o que realmente faz o trabalho
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Verifica a assinatura (continua importante)
    if (user.papel !== 'admin' && user.statusAssinatura !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    // 4. Cria o token JWT.
    const token = jwt.sign({ id: user._id, role: user.papel }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 5. Remove a senha e envia a resposta
    user.senha = undefined;

    res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Verifica 'papel' e 'statusAssinatura' em PT
    if (user.papel !== 'admin' && user.statusAssinatura !== 'active') {
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