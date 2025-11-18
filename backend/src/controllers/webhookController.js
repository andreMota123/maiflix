const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify para evitar timeouts.
  res.status(200).send('OK');
  
  // 2. Processe o payload de forma assíncrona, sem travar a resposta.
  const payload = req.body;
  logger.info('Recebido webhook da Kiwify', { 
    event: payload.event, 
    orderId: payload.order_id,
    customerEmail: payload.customer?.email 
  });
  
  // Log receipt of the webhook immediately
  kiwifyService.logWebhookEvent('received', `Webhook recebido: ${payload.event || 'desconhecido'}`, payload);

  // Use um switch para lidar com diferentes eventos
  switch (payload.event) {
    case 'order.paid': // Compra aprovada / Assinatura renovada
      kiwifyService.activateSubscription(payload.customer, payload);
      break;
    case 'order.refunded': // Reembolso
    case 'order.chargeback': // Chargeback
    case 'subscription.cancelled': // Assinatura cancelada
      kiwifyService.deactivateSubscription(payload.customer, payload);
      break;
    case 'subscription.overdue': // Assinatura atrasada
      kiwifyService.blockSubscription(payload.customer, payload);
      break;
    default:
      logger.warn('Evento Kiwify não tratado', { event: payload.event });
      kiwifyService.logWebhookEvent('processed', `Evento não tratado e ignorado: ${payload.event}`, payload);
  }
};