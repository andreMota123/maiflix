const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');

// Função para ativar a assinatura de um usuário
const activateSubscription = async (customer) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de ativar assinatura sem dados do cliente.");
    return;
  }
  try {
    const email = customer.email.toLowerCase();
    let user = await User.findOne({ 'e-mail': email });

    if (user) {
      // Se o usuário já existe, apenas atualiza o status da assinatura
      user.statusAssinatura = 'active';
      await user.save();
      logger.info('Assinatura ativada com sucesso para usuário existente', { customerEmail: email, userId: user._id });
    } else {
      // Se o usuário não existe, cria um novo com uma senha padrão.
      const fullName = customer.full_name || 'Novo';
      const firstName = fullName.split(' ')[0];
      const plainTextPassword = `${firstName.toLowerCase()}1234`;

      const newUser = new User({
        'e-mail': email,
        name: fullName,
        senha: plainTextPassword, // Senha será criptografada pelo hook pre-save.
        statusAssinatura: 'active',
        papel: 'user',
      });
      await newUser.save(); 
      logger.info(`Webhook 'order.paid' recebido, novo usuário criado e assinatura ativada.`, { customerEmail: email, userId: newUser._id });

      // Envia o e-mail de boas-vindas com a senha em texto plano
      await sendWelcomeEmail(email, firstName, plainTextPassword);
    }

  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura via webhook.', { 
      customerEmail: customer.email,
      errorMessage: error.message,
      stack: error.stack
    });
  }
};

// Função para desativar a assinatura
const deactivateSubscription = async (customer) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    return;
  }
  const customerEmail = customer.email;
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