const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify para evitar timeouts e retentativas desnecessárias.
  res.status(200).send('OK');
  
  // 2. Processe o payload de forma assíncrona.
  const body = req.body;
  // A Kiwify pode enviar os dados dentro de um objeto 'order' ou na raiz, dependendo da versão do webhook
  const order = body.order || body; 
  
  // Log inicial para rastreamento
  logger.info('Iniciando processamento do webhook Kiwify...', { order_id: order?.order_id || 'N/A' });

  if (!order) {
    logger.warn('Webhook da Kiwify recebido com corpo vazio ou inválido.', { payload: body });
    kiwifyService.logWebhookEvent('failed', 'Payload vazio ou inválido.', body);
    return;
  }

  // Extração segura dos dados do cliente
  const customer = order.Customer || order.customer || body.Customer || body.customer;
  
  // --- LÓGICA DE DETECÇÃO DE EVENTO ROBUSTA ---
  // Normalizamos tudo para minúsculo para evitar erros de digitação/formatação
  
  let eventName = body.event; // Alguns webhooks trazem o evento explícito
  const status = order.order_status ? order.order_status.toLowerCase() : '';
  const subStatus = order.Subscription?.status ? order.Subscription.status.toLowerCase() : '';
  const webhookType = (order.webhook_event_type || body.webhook_event_type || '').toLowerCase();

  // LOGICA DE PRIORIDADE:
  // 1. Bloqueios (Chargeback e Atraso) - Ação: Bloquear Acesso
  // 2. Encerramentos (Reembolso e Cancelamento) - Ação: Inativar
  // 3. Acesso (Aprovado e Renovado) - Ação: Ativar/Criar

  if (
      webhookType.includes('late') || 
      webhookType.includes('overdue') || 
      subStatus === 'overdue' ||
      subStatus === 'late' ||
      status === 'late' ||
      status === 'overdue'
  ) {
      eventName = 'subscription.overdue';
  } 
  else if (
      webhookType.includes('chargeback') || 
      webhookType.includes('chargedback') ||
      status.includes('chargeback') ||
      status.includes('chargedback')
  ) {
      eventName = 'order.chargeback';
  }
  else if (
      status === 'refunded' || 
      webhookType.includes('refunded')
  ) {
      eventName = 'order.refunded';
  }
  else if (
      status === 'cancelled' || 
      status === 'canceled' || 
      webhookType.includes('canceled') ||
      webhookType.includes('cancelled') ||
      subStatus === 'canceled'
  ) {
      eventName = 'subscription.cancelled';
  }
  else if (
      status === 'paid' || 
      status === 'approved' || 
      webhookType === 'order_approved' ||
      eventName === 'order_approved'
  ) {
      eventName = 'order.paid';
  }
  else if (subStatus === 'active' && !eventName) {
      // Fallback: se a assinatura está ativa e não caiu nos anteriores
      eventName = 'subscription.renewed';
  }

  // Log detalhado do que foi decidido
  logger.info('Evento Kiwify Identificado', { 
    decisao: eventName, 
    webhookType_recebido: webhookType,
    status_recebido: status,
    email_cliente: customer?.email 
  });
  
  // Registrar no banco de logs
  kiwifyService.logWebhookEvent('received', `Webhook processado como: ${eventName || 'desconhecido'}`, body);

  // Executa a ação baseada no evento identificado
  switch (eventName) {
    case 'order.paid': // Compra aprovada -> Criar ou Reativar
    case 'subscription.renewed': // Renovação -> Manter Ativo
      kiwifyService.activateSubscription(customer, body);
      break;
      
    case 'order.refunded': // Reembolso -> Inativar
    case 'subscription.cancelled': // Cancelamento -> Inativar
      kiwifyService.deactivateSubscription(customer, body);
      break;
      
    case 'order.chargeback': // Chargeback -> BLOQUEAR (Vermelho)
    case 'subscription.overdue': // Atraso -> BLOQUEAR (Vermelho)
      kiwifyService.blockSubscription(customer, body);
      break;
      
    default:
      logger.warn('Evento Kiwify não mapeado nas regras de negócio.', { event: eventName, payload: body });
      kiwifyService.logWebhookEvent('processed', `Evento sem ação definida: ${eventName || status}`, body);
  }
};