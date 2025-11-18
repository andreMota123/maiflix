const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify para evitar timeouts.
  res.status(200).send('OK');
  
  // 2. Processe o payload de forma assíncrona.
  const body = req.body;
  const order = body.order; // A Kiwify geralmente envolve os dados em um objeto 'order'

  // Verifica se existe o objeto order OU se é um payload direto (alguns testes enviam diferente)
  const payloadData = order || body; 

  // Log inicial para garantir que algo chegou
  logger.info('Iniciando processamento do webhook Kiwify...', { order_id: payloadData?.order_id || 'N/A' });

  if (!payloadData) {
    logger.warn('Webhook da Kiwify recebido com corpo vazio ou inválido.', { payload: body });
    kiwifyService.logWebhookEvent('failed', 'Payload vazio ou inválido.', body);
    return;
  }

  const customer = payloadData.Customer || payloadData.customer;
  
  // Tenta determinar um nome de evento padronizado
  let eventName = body.event; 
  if (!eventName) {
      if(payloadData.order_status === 'paid') eventName = 'order.paid';
      else if(payloadData.order_status === 'refunded') eventName = 'order.refunded';
      else if(payloadData.order_status === 'chargeback') eventName = 'order.chargeback';
      else if(payloadData.order_status === 'cancelled') eventName = 'subscription.cancelled';
      else if(payloadData.Subscription?.status === 'overdue') eventName = 'subscription.overdue';
  }
  
  logger.info('Processando evento Kiwify', { 
    event: eventName, 
    orderId: payloadData.order_id,
    customerEmail: customer?.email 
  });
  
  // Log receipt 
  kiwifyService.logWebhookEvent('received', `Webhook recebido: ${eventName || 'evento desconhecido'}`, body);

  switch (eventName) {
    case 'order.paid': // Compra aprovada
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
      // Se for 'order.paid' mas não veio no campo 'event', o switch acima já pegou pela lógica manual.
      // Se cair aqui, é realmente algo desconhecido.
      logger.warn('Evento Kiwify não tratado ou não determinado', { event: eventName, status: payloadData.order_status });
      kiwifyService.logWebhookEvent('processed', `Evento não tratado: ${eventName || payloadData.order_status || 'desconhecido'}`, body);
  }
};