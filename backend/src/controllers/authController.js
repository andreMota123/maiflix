const User = require('../models/User');
const jwt = require('jsonwebtoken');
// NOTA: A importação do bcrypt não é necessária para este modo de diagnóstico
// Mas vamos mantê-la para o caso de o código original ter dependências.

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. Busca o usuário sem incluir a senha (removendo o .select('+senha'))
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }).select('+senha');
    // 2. VERIFICAÇÃO DE DIAGNÓSTICO: APENAS verifica se o usuário existe.
    if (!user) { 
      // Se o usuário não existir, retorna a mensagem
      return res.status(401).json({ message: 'Usuário não encontrado (SEGURANÇA DESATIVADA).' });
    }
    
    // ATENÇÃO: Se o usuário existe, passamos DIRETAMENTE para a criação do token.
    // Isso é feito APENAS PARA TESTE.
    
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

exports.checkSubscription = async (req, res, next) => {
  // Mantemos esta função limpa, mas traduzida:
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