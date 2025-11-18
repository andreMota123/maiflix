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
  // A Kiwify pode mandar o status em 'order_status', 'webhook_event_type' ou dentro de 'Subscription.status'
  let eventName = body.event; 
  
  if (!eventName) {
      const status = payloadData.order_status;
      const subStatus = payloadData.Subscription?.status;
      const webhookType = payloadData.webhook_event_type;

      // Prioridade para tipos explícitos de webhook se existirem
      if (webhookType === 'subscription_late' || webhookType === 'subscription_overdue') {
          eventName = 'subscription.overdue';
      } else if (webhookType === 'order_chargedback') {
          eventName = 'order.chargeback';
      } else {
          // Mapeamento baseado em status
          if(status === 'paid' || status === 'approved') eventName = 'order.paid';
          else if(status === 'refunded') eventName = 'order.refunded';
          // Kiwify pode enviar 'chargeback' ou 'chargedback' (passado)
          else if(status === 'chargeback' || status === 'chargedback') eventName = 'order.chargeback';
          else if(status === 'cancelled' || status === 'canceled') eventName = 'subscription.cancelled';
          
          // Verifica status da assinatura se o status do pedido não for conclusivo ou for relacionado a assinatura
          if (subStatus === 'overdue') eventName = 'subscription.overdue';
          else if (subStatus === 'active' && !eventName) eventName = 'subscription.renewed'; // Assume renovação se ativo e não for nova compra
      }
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
    case 'subscription.renewed': // Renovação
      kiwifyService.activateSubscription(customer, body);
      break;
      
    case 'order.refunded': // Reembolso
    case 'subscription.cancelled': // Assinatura cancelada
      kiwifyService.deactivateSubscription(customer, body);
      break;
      
    case 'order.chargeback': // Chargeback (Bloqueia acesso)
    case 'subscription.overdue': // Assinatura atrasada (Bloqueia acesso)
      kiwifyService.blockSubscription(customer, body);
      break;
      
    default:
      // Se for 'order.paid' mas não veio no campo 'event', o switch acima já pegou pela lógica manual.
      // Se cair aqui, é realmente algo desconhecido.
      logger.warn('Evento Kiwify não tratado ou não determinado', { event: eventName, status: payloadData.order_status });
      kiwifyService.logWebhookEvent('processed', `Evento não tratado: ${eventName || payloadData.order_status || 'desconhecido'}`, body);
  }
};