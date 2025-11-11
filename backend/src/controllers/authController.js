const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. Corrigido: Busca por 'e-mail' e inclui o campo 'senha'
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }).select('+senha');

    // 2. Verifica se o usuário existe e se a senha corresponde
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Corrigido: Verifica 'papel' e 'statusAssinatura'
    if (user.papel !== 'admin' && user.statusAssinatura !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    // 4. Corrigido: Cria o token com 'papel'
    const token = jwt.sign({ id: user._id, role: user.papel }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 5. Corrigido: Remove 'senha' da resposta
    user.senha = undefined;

    // 6. Envia a resposta
    res.status(200).json({
      token,
      user, // O user agora tem os campos em português
    });
  } catch (error) {
    next(error);
  }
};

// Corrigindo a função checkSubscription também
exports.checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Corrigido: Verifica 'papel' e 'statusAssinatura'
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