
const kiwifyService = require('../services/kiwifyService');
const logger = require('../utils/logger');

exports.handleKiwifyWebhook = (req, res) => {
  // 1. Responda IMEDIATAMENTE para a Kiwify (Status 200 OK)
  res.status(200).send('OK');
  
  // 2. Extrair dados do payload
  const body = req.body;
  // A Kiwify pode enviar os dados dentro de um objeto 'order' ou na raiz
  const order = body.order || body; 
  
  // Log inicial
  logger.info('Iniciando processamento do webhook Kiwify...', { order_id: order?.order_id || 'N/A' });

  if (!order) {
    logger.warn('Webhook recebido com corpo vazio ou formato desconhecido.', { payload: body });
    kiwifyService.logWebhookEvent('failed', 'Payload vazio ou inválido.', body);
    return;
  }

  // Extração segura dos dados do cliente
  const customer = order.Customer || order.customer || body.Customer || body.customer;
  
  // --- INTELIGÊNCIA DE DETECÇÃO DE EVENTOS ---
  // Normalizamos para minúsculo para evitar falhas por Case Sensitive
  
  let eventName = body.event || order.webhook_event_type || ''; 
  const status = (order.order_status || '').toLowerCase();
  const subStatus = (order.Subscription?.status || '').toLowerCase();
  const webhookType = (order.webhook_event_type || body.webhook_event_type || '').toLowerCase();

  // Normalização da String de Evento (caso venha vazia, tentamos inferir)
  if (!eventName) eventName = webhookType;

  // Regras de Prioridade (A ordem importa):
  
  // 1. BLOQUEIOS (Atraso ou Chargeback) -> Ação: blockSubscription
  if (
      webhookType.includes('chargeback') || 
      webhookType.includes('chargedback') ||
      status.includes('chargeback') ||
      status.includes('chargedback')
  ) {
      eventName = 'order.chargeback';
  }
  else if (
      webhookType.includes('late') || 
      webhookType.includes('overdue') || 
      webhookType.includes('subscription_late') ||
      subStatus === 'overdue' ||
      subStatus === 'late' ||
      status === 'late'
  ) {
      eventName = 'subscription.overdue';
  } 
  
  // 2. ENCERRAMENTOS (Reembolso ou Cancelamento) -> Ação: deactivateSubscription
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
  
  // 3. ATIVAÇÃO (Compra Aprovada ou Renovação) -> Ação: activateSubscription
  else if (
      status === 'paid' || 
      status === 'approved' || 
      webhookType === 'order_approved' ||
      webhookType === 'order_paid' ||
      webhookType === 'subscription_renewed'
  ) {
      eventName = 'order.paid';
  }
  else if (subStatus === 'active' && !eventName) {
      eventName = 'subscription.renewed';
  }

  // Log da decisão tomada
  logger.info('Evento Kiwify Classificado', { 
    evento_final: eventName, 
    status_original: status,
    tipo_webhook: webhookType,
    email: customer?.email 
  });
  
  // Registrar no banco
  kiwifyService.logWebhookEvent('received', `Classificado como: ${eventName || 'desconhecido'}`, body);

  // Executar Ação
  switch (eventName) {
    case 'order.paid': 
    case 'subscription.renewed': 
    case 'order_approved':
    case 'subscription_renewed':
      kiwifyService.activateSubscription(customer, body);
      break;
      
    case 'order.refunded': 
    case 'subscription.cancelled': 
    case 'subscription_canceled':
      kiwifyService.deactivateSubscription(customer, body);
      break;
      
    case 'order.chargeback': 
    case 'order_chargedback':
    case 'subscription.overdue': 
    case 'subscription_late':
      kiwifyService.blockSubscription(customer, body);
      break;
      
    default:
      logger.warn('Evento não possui ação definida.', { event: eventName });
      kiwifyService.logWebhookEvent('processed', `Sem ação configurada para: ${eventName}`, body);
  }
};
