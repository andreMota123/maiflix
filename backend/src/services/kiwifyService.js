const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');

const activateSubscription = async (customer) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de ativar assinatura sem dados do cliente.");
    return;
  }
  try {
    const email = customer.email.toLowerCase();
    let user = await User.findOne({ email: email });

    if (user) {
      user.subscriptionStatus = 'active';
      await user.save();
      logger.info('Assinatura ativada com sucesso para usuário existente', { customerEmail: email, userId: user._id });
    } else {
      const fullName = customer.full_name || 'Novo Assinante';
      const firstName = fullName.split(' ')[0] || 'aluno'; // Fallback for empty name
      
      // Sanitize and ensure base password part is not too short
      let basePassword = firstName.toLowerCase().replace(/[^a-z0-9]/gi, ''); 
      if (basePassword.length < 2) {
          basePassword = 'aluno';
      }
      const plainTextPassword = `${basePassword}1234`;

      const newUser = new User({
        email: email,
        name: fullName,
        password: plainTextPassword, // Use the virtual setter which triggers the pre-save hook.
        subscriptionStatus: 'active',
        role: 'user',
      });
      await newUser.save(); 
      logger.info(`Webhook 'order.paid' recebido, novo usuário criado e assinatura ativada.`, { customerEmail: email, userId: newUser._id });

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

const deactivateSubscription = async (customer) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    return;
  }
  const customerEmail = customer.email;
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
