const User = require('../models/User');
const logger = require('../utils/logger');

// Função para ATIVAR ou CRIAR assinatura de um usuário
const activateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de ativar assinatura sem email do cliente.");
    return;
  }

  const email = customerEmail.toLowerCase();
  
  // AQUI ESTÁ A SENHA PADRÃO DO ASSINANTE!
  const defaultPassword = 'mudar123'; 

  try {
    let user = await User.findOne({ email: email });

    if (user) {
      // 1. Usuário já existe, apenas reativa a assinatura
      user.subscriptionStatus = 'active';
      await user.save();
      logger.info('Assinatura RE-ativada com sucesso', { customerEmail: email });
    } else {
      // 2. Usuário NÃO existe, precisamos CRIAR um novo
      logger.info('Novo usuário. Criando conta de assinante...', { customerEmail: email });
      
      const newUser = new User({
        email: email,
        password: defaultPassword, // O hook pre-save no User.js vai criptografar isso
        role: 'subscriber', // Define a função como assinante
        subscriptionStatus: 'active'
      });
      
      await newUser.save();
      logger.info('Novo assinante criado com sucesso.', { customerEmail: email });
    }
  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura no banco de dados.', {
      customerEmail: email,
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
      logger.info('Assinatura desativada com sucesso', { customerEmail });
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