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

  // Use um switch para lidar com diferentes eventos
  switch (payload.event) {
    case 'order.paid': // Assinatura paga / renovada
      kiwifyService.activateSubscription(payload.customer);
      break;
    case 'order.refunded': // Assinatura reembolsada
    case 'subscription.cancelled': // Assinatura cancelada
      kiwifyService.deactivateSubscription(payload.customer);
      break;
    default:
      logger.warn('Evento Kiwify não tratado', { event: payload.event });
  }
};