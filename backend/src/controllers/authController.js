const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res, next) => {
  // O frontend ainda envia 'email' e 'password'.
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    // 1. Busca o usuário por 'e-mail' e inclui a 'senha' (hash) na busca.
    const user = await User.findOne({ 'e-mail': email.toLowerCase() }).select('+senha');

    // 2. Se o usuário não for encontrado, as credenciais são inválidas.
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3. Compara a senha fornecida com o hash armazenado no banco de dados.
    const isMatch = await bcrypt.compare(password, user.senha);

    // 4. Se as senhas não corresponderem, as credenciais são inválidas.
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 5. Verifica o 'papel' e 'statusAssinatura'.
    if (user.papel !== 'admin' && user.statusAssinatura !== 'active') {
      return res.status(403).json({ message: 'Acesso negado. Sua assinatura não está ativa.' });
    }

    // 6. Cria o token JWT com o 'papel' do usuário.
    const token = jwt.sign({ id: user._id, role: user.papel }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    // 7. Remove a 'senha' do objeto antes de enviar a resposta.
    user.senha = undefined;

    // 8. Envia o token e os dados do usuário.
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
    
    // MUDANÇA: Verifica 'papel' e 'statusAssinatura'.
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