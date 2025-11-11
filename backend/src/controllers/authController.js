const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. Busca o usuário sem incluir a senha (não vamos usá-la)
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }); // Corrigido para 'e-mail'

    // 2. Verifica APENAS se o usuário existe. A SENHA NÃO É VERIFICADA.
    if (!user) { // Se o usuário não existe, rejeita.
      return res.status(401).json({ message: 'Usuário não encontrado (SEGURANÇA DESATIVADA).' });
    }
    // SE O USUÁRIO EXISTE, PASSA DIRETO PARA O ITEM 3.

    // 3. Verifica a assinatura (continua importante)
    if (user.papel !== 'admin' && user.statusAssinatura !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    // 4. Cria o token JWT.
    const token = jwt.sign({ id: user._id, role: user.papel }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 5. Envia o token e os dados do usuário.
    res.status(200).json({
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ... (o resto do arquivo checkSubscription) ...

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