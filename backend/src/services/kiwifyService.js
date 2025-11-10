const User = require('../models/User');
const logger = require('../utils/logger');

// Função para ativar a assinatura de um usuário
const activateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de ativar assinatura sem email do cliente.");
    return;
  }
  try {
    const email = customerEmail.toLowerCase();
    let user = await User.findOne({ email });

    if (user) {
      // Se o usuário já existe, apenas atualiza o status da assinatura
      user.subscriptionStatus = 'active';
      await user.save();
      logger.info('Assinatura ativada com sucesso para usuário existente', { customerEmail: email, userId: user._id });
    } else {
      // Se o usuário não existe, cria um novo com uma senha padrão.
      const newUser = new User({
        email: email,
        name: 'Novo Assinante', // Um nome padrão que o usuário poderá alterar depois
        password: 'mudar123',   // Senha padrão que SERÁ CRIPTOGRAFADA pelo hook pre-save usando bcryptjs.
        subscriptionStatus: 'active',
        role: 'user',
      });
      // A chamada a .save() aciona o hook de hash de senha, garantindo a consistência.
      await newUser.save(); 
      logger.info(`Webhook 'order.paid' recebido, novo usuário criado e assinatura ativada.`, { customerEmail: email, userId: newUser._id });
    }

  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura via webhook.', { 
      customerEmail, 
      errorMessage: error.message,
      stack: error.stack
    });
  }
};

// Função para desativar a assinatura
const deactivateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    return;
  }
  try {
    const user = await User.findOneAndUpdate(
      { email: customerEmail.toLowerCase() },
      { subscriptionStatus: 'inactive' },
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
