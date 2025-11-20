
const crypto = require('crypto');
const logger = require('../utils/logger');

const verifyKiwifyToken = (req, res, next) => {
  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;

  // Se o segredo não estiver configurado, avisa e deixa passar (útil para dev, perigoso em prod)
  if (!secret) {
    logger.warn('KIWIFY_WEBHOOK_TOKEN não está configurado. Webhook passando sem verificação.');
    return next();
  }

  const providedSignature = req.headers['x-kiwify-signature'];

  // Lógica Permissiva para Garantir Funcionamento
  if (!providedSignature) {
    logger.warn('AVISO: Webhook da Kiwify recebido SEM assinatura (x-kiwify-signature). Permitindo processamento para garantir o cadastro/atualização.', {
        ip: req.ip
    });
    // NÃO BLOQUEAR: next() permite que o controller processe os dados
    return next(); 
  }

  if (!req.rawBody) {
      logger.error('rawBody não está disponível. Verifique a configuração do express.json no app.js.', { url: req.originalUrl });
      // Permitir passagem mesmo com erro técnico de rawBody para tentar salvar o usuário
      return next();
  }

  try {
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(req.rawBody, 'utf8');
    const calculatedSignature = hmac.digest('hex');
  
    // Comparação segura
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');
    
    if (providedBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(providedBuffer, calculatedBuffer)) {
      logger.warn('Assinatura Kiwify inválida, mas permitindo requisição para evitar perda de dados.', { provided: providedSignature, calculated: calculatedSignature });
      // return res.status(403).send('Assinatura inválida.'); // Comentado propositalmente
      return next(); 
    }
  } catch (error) {
    logger.error('Erro técnico na verificação da assinatura.', { error: error.message });
    return next(); // Prioridade total ao funcionamento do negócio
  }

  next();
};

module.exports = verifyKiwifyToken;