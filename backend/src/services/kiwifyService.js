const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');
const WebhookLog = require('../models/WebhookLog');

const logWebhookEvent = async (status, message, payload) => {
  try {
    await WebhookLog.create({
      source: 'Kiwify',
      event: payload.event || 'unknown',
      status,
      message,
      payload
    });
  } catch (logError) {
    logger.error('Falha ao criar log de webhook.', { 
      errorMessage: logError.message,
      originalEvent: payload.event
    });
  }
};


const activateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de ativar assinatura sem dados do cliente.");
    await logWebhookEvent('failed', 'Dados do cliente ou email ausentes no payload.', payload);
    return;
  }
  const email = customer.email.toLowerCase();
  try {
    let user = await User.findOne({ email: email });

    if (user) {
      user.subscriptionStatus = 'active';
      await user.save();
      logger.info('Assinatura ativada com sucesso para usuário existente', { customerEmail: email, userId: user._id });
      await logWebhookEvent('processed', `Assinatura ativada para usuário existente: ${email}`, payload);
    } else {
      const fullName = customer.full_name || 'Novo Assinante';
      const firstName = fullName.split(' ')[0] || 'aluno'; // Fallback for empty name
      
      // Sanitize and ensure base password part is not too short
      let basePassword = firstName.toLowerCase().replace(/[^a-z0-9]/gi, ''); 
      if (basePassword.length < 2) {
          basePassword = 'aluno';
      }
      const plainTextPassword = `${basePassword}123`;

      const newUser = new User({
        email: email,
        name: fullName,
        password: plainTextPassword, // Use the virtual setter which triggers the pre-save hook.
        subscriptionStatus: 'active',
        role: 'user',
      });
      await newUser.save(); 
      logger.info(`Webhook 'order.paid' recebido, novo usuário criado e assinatura ativada.`, { customerEmail: email, userId: newUser._id });
      await logWebhookEvent('processed', `Novo usuário criado e assinatura ativada: ${email}`, payload);
      await sendWelcomeEmail(email, firstName, plainTextPassword);
    }

  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura via webhook.', { 
      customerEmail: customer.email,
      errorMessage: error.message,
      stack: error.stack
    });
    await logWebhookEvent('failed', `Erro ao processar ativação para ${email}: ${error.message}`, payload);
  }
};

const deactivateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    await logWebhookEvent('failed', 'Dados do cliente ou email ausentes no payload.', payload);
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
      await logWebhookEvent('processed', `Assinatura desativada para: ${customerEmail}`, payload);
    } else {
      logger.warn('Webhook de cancelamento/reembolso recebido, mas usuário não foi encontrado.', { customerEmail });
      await logWebhookEvent('failed', `Usuário não encontrado para desativação: ${customerEmail}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao desativar assinatura no banco de dados.', {
      customerEmail,
      errorMessage: error.message,
      stack: error.stack
    });
    await logWebhookEvent('failed', `Erro ao processar desativação para ${customerEmail}: ${error.message}`, payload);
  }
};

const blockSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de bloquear assinatura sem email do cliente.");
    await logWebhookEvent('failed', 'Dados do cliente ou email ausentes no payload para bloqueio.', payload);
    return;
  }
  const customerEmail = customer.email;
  try {
    const user = await User.findOneAndUpdate(
      { email: customerEmail.toLowerCase() },
      { subscriptionStatus: 'blocked' },
      { new: true }
    );
    if (user) {
      logger.info('Assinatura bloqueada devido a pagamento atrasado', { customerEmail, userId: user._id });
      await logWebhookEvent('processed', `Assinatura bloqueada para: ${customerEmail}`, payload);
    } else {
      logger.warn('Webhook de assinatura atrasada recebido, mas usuário não foi encontrado.', { customerEmail });
      await logWebhookEvent('failed', `Usuário não encontrado para bloqueio: ${customerEmail}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao bloquear assinatura no banco de dados.', {
      customerEmail,
      errorMessage: error.message,
      stack: error.stack
    });
    await logWebhookEvent('failed', `Erro ao processar bloqueio para ${customerEmail}: ${error.message}`, payload);
  }
};

module.exports = {
  activateSubscription,
  deactivateSubscription,
  blockSubscription,
  logWebhookEvent,
};