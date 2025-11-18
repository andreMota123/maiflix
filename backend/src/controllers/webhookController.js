const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify para evitar timeouts.
  res.status(200).send('OK');
  
  // 2. Processe o payload de forma assíncrona, sem travar a resposta.
  const body = req.body;
  const order = body.order;

  // Adiciona verificação para garantir que o objeto 'order' exista
  if (!order) {
    logger.warn('Webhook da Kiwify recebido sem o objeto "order".', { payload: body });
    kiwifyService.logWebhookEvent('failed', 'Payload do webhook não continha o objeto "order".', body);
    return; // Encerra o processamento se o payload for inválido
  }

  const customer = order.Customer;
  
  // Tenta determinar um nome de evento padronizado
  let eventName = body.event; // Para compatibilidade com outros formatos
  if (!eventName) {
      if(order.order_status === 'paid') eventName = 'order.paid';
      else if(order.order_status === 'refunded') eventName = 'order.refunded';
      else if(order.order_status === 'chargeback') eventName = 'order.chargeback';
      else if(order.order_status === 'cancelled') eventName = 'subscription.cancelled';
      else if(order.Subscription?.status === 'overdue') eventName = 'subscription.overdue';
  }
  
  logger.info('Recebido webhook da Kiwify', { 
    event: eventName, 
    orderId: order.order_id,
    customerEmail: customer?.email 
  });
  
  // Log receipt of the webhook immediately
  kiwifyService.logWebhookEvent('received', `Webhook recebido: ${eventName || 'evento desconhecido'}`, body);

  // Use o eventName determinado para o switch
  switch (eventName) {
    case 'order.paid': // Compra aprovada / Assinatura renovada
      kiwifyService.activateSubscription(customer, body);
      break;
    case 'order.refunded': // Reembolso
    case 'order.chargeback': // Chargeback
    case 'subscription.cancelled': // Assinatura cancelada
      kiwifyService.deactivateSubscription(customer, body);
      break;
    case 'subscription.overdue': // Assinatura atrasada
      kiwifyService.blockSubscription(customer, body);
      break;
    default:
      logger.warn('Evento Kiwify não tratado ou não determinado', { event: eventName, order_status: order.order_status });
      kiwifyService.logWebhookEvent('processed', `Evento não tratado e ignorado: ${eventName || order.order_status || 'desconhecido'}`, body);
  }
};