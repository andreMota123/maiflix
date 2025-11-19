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

// Função auxiliar para encontrar usuário por email ou email original da Kiwify
const findUserByKiwifyEmail = async (email) => {
    return await User.findOne({
        $or: [
            { email: email },
            { kiwifyEmail: email }
        ]
    });
};

const activateSubscription = async (customer, payload) => {
  if (!customer || !customer.email) {
    await logWebhookEvent('failed', 'Email do cliente não encontrado.', payload);
    return;
  }
  const email = customer.email.toLowerCase();
  
  try {
    // Busca inteligente: procura pelo email atual OU pelo email original da Kiwify
    let user = await findUserByKiwifyEmail(email);

    if (user) {
      // Reativar usuário existente
      user.subscriptionStatus = 'active';
      if (user.role !== 'admin') {
          user.role = 'user'; // Garante role correta
      }
      
      // Se o usuário existe mas não tem kiwifyEmail setado, vamos setar agora para garantir vínculos futuros
      if (!user.kiwifyEmail && user.email === email) {
          user.kiwifyEmail = email;
      }

      await user.save();
      logger.info(`Usuário reativado: ${user.email} (Kiwify ID: ${email})`);
      await logWebhookEvent('processed', `Assinatura reativada: ${user.email}`, payload);
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
        kiwifyEmail: email, // Salva explicitamente o email da Kiwify na criação
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
    // Busca inteligente
    const user = await findUserByKiwifyEmail(email);

    if (user) {
        user.subscriptionStatus = 'inactive';
        await user.save();
        logger.info(`Usuário inativado: ${user.email} (Kiwify ID: ${email})`);
        await logWebhookEvent('processed', `Assinatura INATIVADA: ${user.email}`, payload);
    } else {
        logger.warn(`Tentativa de inativar usuário inexistente: ${email}`);
        await logWebhookEvent('failed', `Usuário não encontrado para inativação: ${email}`, payload);
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
    // Busca inteligente
    const user = await findUserByKiwifyEmail(email);

    if (user) {
        user.subscriptionStatus = 'blocked';
        await user.save();
        logger.info(`!!! USUÁRIO BLOQUEADO POR INADIMPLÊNCIA: ${user.email} (Kiwify ID: ${email}) !!!`);
        await logWebhookEvent('processed', `USUÁRIO BLOQUEADO (Chargeback/Atraso): ${user.email}`, payload);
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