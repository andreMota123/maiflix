const User = require('../models/User');
const logger = require('../utils/logger');

// Função para ativar a assinatura de um usuário
const activateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de ativar assinatura sem email do cliente.");
    return;
  }
  try {
    const user = await User.findOneAndUpdate(
      { email: customerEmail.toLowerCase() },
      { subscriptionStatus: 'active' },
      { new: true, upsert: false } // upsert: false -> não cria um novo usuário, apenas atualiza um existente
    );
    if (user) {
      logger.info('Assinatura ativada com sucesso', { customerEmail, userId: user._id });
    } else {
      logger.warn(`Webhook 'order.paid' recebido, mas usuário não encontrado no banco de dados.`, { customerEmail });
    }
  } catch (error) {
    logger.error('Erro ao ativar assinatura no banco de dados.', { 
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
      { subscriptionStatus: 'inactive' }
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
