const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify para evitar timeouts.
  res.status(200).send('OK');
  
  // 2. Processe o payload de forma assíncrona.
  const body = req.body;
  // A Kiwify pode enviar os dados dentro de um objeto 'order' ou na raiz, dependendo da versão do webhook
  const order = body.order || body; 
  
  // Log inicial
  logger.info('Iniciando processamento do webhook Kiwify...', { order_id: order?.order_id || 'N/A' });

  if (!order) {
    logger.warn('Webhook da Kiwify recebido com corpo vazio ou inválido.', { payload: body });
    kiwifyService.logWebhookEvent('failed', 'Payload vazio ou inválido.', body);
    return;
  }

  const customer = order.Customer || order.customer || body.Customer || body.customer;
  
  // --- LÓGICA DE DETECÇÃO DE EVENTO ROBUSTA ---
  // A Kiwify pode mandar o status em vários lugares. Vamos checar todos.
  
  let eventName = body.event; // Tenta pegar o evento direto se existir
  const status = order.order_status;
  const subStatus = order.Subscription?.status;
  const webhookType = order.webhook_event_type || body.webhook_event_type;

  // Normaliza para minúsculo para evitar erros de case sensitive
  const safeStatus = status ? status.toLowerCase() : '';
  const safeWebhookType = webhookType ? webhookType.toLowerCase() : '';
  const safeSubStatus = subStatus ? subStatus.toLowerCase() : '';

  // 1. Verifica Bloqueios (Prioridade Alta)
  if (
      safeWebhookType === 'subscription_late' || 
      safeWebhookType === 'subscription_overdue' || 
      safeSubStatus === 'overdue' ||
      safeSubStatus === 'late' ||
      safeStatus === 'late'
  ) {
      eventName = 'subscription.overdue';
  } 
  else if (
      safeWebhookType === 'order_chargedback' || 
      safeStatus === 'chargedback' || 
      safeStatus === 'chargeback' ||
      safeWebhookType === 'chargeback'
  ) {
      eventName = 'order.chargeback';
  }
  // 2. Verifica Reembolso/Cancelamento
  else if (
      safeStatus === 'refunded' || 
      safeWebhookType === 'order_refunded'
  ) {
      eventName = 'order.refunded';
  }
  else if (
      safeStatus === 'cancelled' || 
      safeStatus === 'canceled' || 
      safeWebhookType === 'subscription_canceled' ||
      safeSubStatus === 'canceled'
  ) {
      eventName = 'subscription.cancelled';
  }
  // 3. Verifica Aprovação/Renovação
  else if (
      safeStatus === 'paid' || 
      safeStatus === 'approved' || 
      safeWebhookType === 'order_approved'
  ) {
      eventName = 'order.paid';
  }
  else if (safeSubStatus === 'active' && !eventName) {
      // Se está ativa e não caiu nos casos acima, assumimos renovação ou verificação
      eventName = 'subscription.renewed';
  }

  logger.info('Processando evento Kiwify Identificado', { 
    eventDetectado: eventName, 
    webhookType: safeWebhookType,
    status: safeStatus,
    subStatus: safeSubStatus,
    customerEmail: customer?.email 
  });
  
  // Log no banco
  kiwifyService.logWebhookEvent('received', `Webhook recebido: ${eventName || 'desconhecido'}`, body);

  // Executa a ação baseada no evento identificado
  switch (eventName) {
    case 'order.paid': // Compra aprovada (Ativa)
    case 'subscription.renewed': // Renovação (Ativa)
      kiwifyService.activateSubscription(customer, body);
      break;
      
    case 'order.refunded': // Reembolso (Inativa)
    case 'subscription.cancelled': // Assinatura cancelada (Inativa)
      kiwifyService.deactivateSubscription(customer, body);
      break;
      
    case 'order.chargeback': // Chargeback (BLOQUEIA ACESSO)
    case 'subscription.overdue': // Assinatura atrasada (BLOQUEIA ACESSO)
      kiwifyService.blockSubscription(customer, body);
      break;
      
    default:
      logger.warn('Evento Kiwify não tratado ou inconclusivo', { event: eventName, payload: body });
      kiwifyService.logWebhookEvent('processed', `Evento não tratado: ${eventName || safeStatus || 'desconhecido'}`, body);
  }
};