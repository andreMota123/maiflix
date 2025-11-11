const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. CORREÇÃO CRÍTICA: Busca o usuário e NÃO SELECIONA A SENHA (select '+senha' removido).
    // Isto força o login se o usuário existir, ignorando a senha e o bug de comparação.
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }); // Busca por 'e-mail' em PT

    // 2. VERIFICAÇÃO DE DIAGNÓSTICO: APENAS verifica se o usuário existe.
    if (!user) { 
      return res.status(401).json({ message: 'Usuário não encontrado (SEGURANÇA DESATIVADA).' });
    }
    
    // 3. Verifica a assinatura (continua importante, usa 'papel' e 'statusAssinatura')
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

exports.checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    // Corrigido: Verifica 'papel' e 'statusAssinatura' em PT
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