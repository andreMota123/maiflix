const User = require('../models/User');
const logger = require('../utils/logger');

// Função para ativar a assinatura de um usuário
// ...
const activateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de ativar assinatura sem email do cliente.");
    return;
  }
  const email = customerEmail.toLowerCase();
  const defaultPassword = 'mudar123'; 

  try {
    // Corrigido: Procura por 'e-mail'
    let user = await User.findOne({ 'e-mail': email });

    if (user) {
      // Corrigido: Atualiza 'statusAssinatura'
      user.statusAssinatura = 'active';
      await user.save();
      logger.info('Assinatura RE-ativada com sucesso', { customerEmail: email });
    } else {
      logger.info('Novo usuário. Criando conta de assinante...', { customerEmail: email });
      
      const salt = await bcrypt.genSalt(10); // Adicionado para criptografar
      const hashedPassword = await bcrypt.hash(defaultPassword, salt); // Criptografa a senha

      // Corrigido: Cria com campos em Português
      const newUser = new User({
        name: email.split('@')[0], // Um nome padrão
        'e-mail': email,
        senha: hashedPassword, // Salva a senha criptografada
        papel: 'user', 
        statusAssinatura: 'active'
      });
      
      await newUser.save();
      logger.info('Novo assinante (em PT) criado com sucesso.', { customerEmail: email });
    }
  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura no banco de dados.', {
      customerEmail: email,
      errorMessage: error.message
    });
  }
};
// ...

// Função para desativar a assinatura
const deactivateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    return;
  }
  try {
    // MUDANÇA: Busca por 'e-mail' e atualiza 'statusAssinatura'.
    const user = await User.findOneAndUpdate(
      { 'e-mail': customerEmail.toLowerCase() },
      { statusAssinatura: 'inactive' },
      { new: true }
    );
    if (user) {
      logger.info('Assinatura desativada com sucesso', { customerEmail, userId: user._id });
    } else {
      logger.warn('Webhook de cancelamento/reembolso recebido, mas usuário não foi encontrado.', { customerEmail });
    }
  } catch (error) {
    logger.error('Erro ao desativar assinatura no banco de dados.', {
      customerEmail,
      errorMessage: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  activateSubscription,
  deactivateSubscription,
};