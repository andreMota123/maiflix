const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');
const WebhookLog = require('../models/WebhookLog');

const logWebhookEvent = async (status, message, payload) => {
  try {
    const order = payload.order || payload;
    const customer = order.Customer || order.customer || payload.Customer || payload.customer || {};
    
    // Tenta extrair o nome do evento para o log ficar bonito
    let event = payload.event || order.webhook_event_type || order.order_status || 'unknown';

    await WebhookLog.create({
      source: 'Kiwify',
      event,
      status,
      message,
      payload,
      customerEmail: customer.email?.toLowerCase(),
    });
  } catch (logError) {
    logger.error('Falha ao criar log de webhook.', { 
      errorMessage: logError.message
    });
  }
};

const activateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    logger.warn("Tentativa de ativar assinatura sem dados do cliente.");
    await logWebhookEvent('failed', 'Dados do cliente ausentes.', payload);
    return;
  }
  const email = customer.email.toLowerCase();
  try {
    let user = await User.findOne({ email: email });

    if (user) {
      user.subscriptionStatus = 'active';
      // Se o usuário estava bloqueado ou inativo, reativa
      await user.save();
      logger.info('Assinatura ativada/renovada para usuário existente', { customerEmail: email });
      await logWebhookEvent('processed', `Assinatura ativada para: ${email}`, payload);
    } else {
      const fullName = customer.full_name || customer.name || 'Novo Assinante';
      const firstName = fullName.split(' ')[0] || 'aluno';
      
      // Gera senha segura baseada no nome
      let basePassword = firstName.toLowerCase().replace(/[^a-z0-9]/gi, ''); 
      if (basePassword.length < 2) basePassword = 'aluno';
      const plainTextPassword = `${basePassword}123`;

      const newUser = new User({
        email: email,
        name: fullName,
        password: plainTextPassword, 
        subscriptionStatus: 'active',
        role: 'user',
      });
      await newUser.save(); 
      logger.info(`Novo usuário criado via Kiwify.`, { customerEmail: email });
      await logWebhookEvent('processed', `Novo usuário criado: ${email}`, payload);
      await sendWelcomeEmail(email, firstName, plainTextPassword);
    }

  } catch (error) {
    logger.error('Erro ao ativar assinatura.', { error: error.message });
    await logWebhookEvent('failed', `Erro na ativação: ${error.message}`, payload);
  }
};

const deactivateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    await logWebhookEvent('failed', 'Email ausente para desativação.', payload);
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
      logger.info('Assinatura desativada (Cancelamento/Reembolso)', { customerEmail });
      await logWebhookEvent('processed', `Assinatura desativada: ${customerEmail}`, payload);
    } else {
      await logWebhookEvent('failed', `Usuário não encontrado para desativar: ${customerEmail}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao desativar assinatura.', { error: error.message });
    await logWebhookEvent('failed', `Erro na desativação: ${error.message}`, payload);
  }
};

const blockSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    await logWebhookEvent('failed', 'Email ausente para bloqueio.', payload);
    return;
  }
  const customerEmail = customer.email;
  try {
    // Define status explicitamente como 'blocked'
    const user = await User.findOneAndUpdate(
      { email: customerEmail.toLowerCase() },
      { subscriptionStatus: 'blocked' },
      { new: true }
    );
    
    if (user) {
      logger.info('ACESSO BLOQUEADO (Chargeback/Atraso)', { customerEmail });
      await logWebhookEvent('processed', `ACESSO BLOQUEADO para: ${customerEmail}`, payload);
    } else {
      logger.warn('Tentativa de bloqueio falhou: Usuário não encontrado', { customerEmail });
      await logWebhookEvent('failed', `Usuário não encontrado para bloquear: ${customerEmail}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao bloquear assinatura.', { error: error.message });
    await logWebhookEvent('failed', `Erro no bloqueio: ${error.message}`, payload);
  }
};

module.exports = {
  activateSubscription,
  deactivateSubscription,
  blockSubscription,
  logWebhookEvent,
};