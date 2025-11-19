
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendWelcomeEmail } = require('../utils/emailService');
const WebhookLog = require('../models/WebhookLog');

const logWebhookEvent = async (status, message, payload) => {
  try {
    const order = payload.order || payload;
    const customer = order.Customer || order.customer || payload.Customer || payload.customer || {};
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
    logger.error('Falha ao salvar log do webhook', { error: logError.message });
  }
};

const activateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    await logWebhookEvent('failed', 'Email do cliente não encontrado.', payload);
    return;
  }
  const email = customer.email.toLowerCase();
  
  try {
    let user = await User.findOne({ email: email });

    if (user) {
      // Reativar usuário existente
      user.subscriptionStatus = 'active';
      if (user.role !== 'admin') {
          user.role = 'user'; // Garante role correta
      }
      await user.save();
      logger.info(`Usuário reativado: ${email}`);
      await logWebhookEvent('processed', `Assinatura reativada: ${email}`, payload);
    } else {
      // CRIAR NOVO USUÁRIO
      const fullName = customer.full_name || customer.name || 'Novo Assinante';
      const firstName = fullName.split(' ')[0] || 'usuario';
      
      // REGRA DE SENHA: primeiro nome minúsculo + 123 (ex: ana123)
      let cleanName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanName.length < 2) cleanName = 'aluno';
      const plainPassword = `${cleanName}123`;

      const newUser = new User({
        email: email,
        name: fullName,
        password: plainPassword, 
        subscriptionStatus: 'active',
        role: 'user',
      });
      
      await newUser.save();
      
      logger.info(`Novo usuário criado via Kiwify: ${email} com senha ${plainPassword}`);
      await logWebhookEvent('processed', `Novo usuário criado: ${email}`, payload);
      
      // Enviar email com a senha
      await sendWelcomeEmail(email, firstName, plainPassword);
    }
  } catch (error) {
    logger.error('Erro ao ativar assinatura', { error: error.message });
    await logWebhookEvent('failed', `Erro na ativação: ${error.message}`, payload);
  }
};

const deactivateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) return;
  const email = customer.email.toLowerCase();
  try {
    // Cancelamento/Reembolso -> Inactive (perde acesso, mas mantém histórico)
    const user = await User.findOneAndUpdate(
      { email: email },
      { subscriptionStatus: 'inactive' },
      { new: true }
    );
    if (user) {
        logger.info(`Usuário inativado: ${email}`);
        await logWebhookEvent('processed', `Assinatura INATIVADA: ${email}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao inativar assinatura', { error: error.message });
    await logWebhookEvent('failed', `Erro ao inativar: ${error.message}`, payload);
  }
};

const blockSubscription = async (customer, payload) => {
  if (!customer || !customer.email) return;
  const email = customer.email.toLowerCase();
  try {
    // Chargeback/Atraso -> BLOCKED (Status de bloqueio explícito)
    const user = await User.findOneAndUpdate(
      { email: email },
      { subscriptionStatus: 'blocked' },
      { new: true }
    );
    if (user) {
        logger.info(`!!! USUÁRIO BLOQUEADO POR INADIMPLÊNCIA: ${email} !!!`);
        await logWebhookEvent('processed', `USUÁRIO BLOQUEADO (Chargeback/Atraso): ${email}`, payload);
    } else {
        logger.warn(`Tentativa de bloquear usuário inexistente: ${email}`);
        await logWebhookEvent('failed', `Usuário não encontrado para bloqueio: ${email}`, payload);
    }
  } catch (error) {
    logger.error('Erro ao bloquear assinatura', { error: error.message });
    await logWebhookEvent('failed', `Erro ao bloquear: ${error.message}`, payload);
  }
};

module.exports = {
  activateSubscription,
  deactivateSubscription,
  blockSubscription,
  logWebhookEvent,
};
