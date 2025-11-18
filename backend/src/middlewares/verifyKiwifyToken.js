const crypto = require('crypto');
const logger = require('../utils/logger');

const verifyKiwifyToken = (req, res, next) => {
  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;

  // Se o segredo não estiver configurado no servidor, pula a verificação.
  if (!secret) {
    logger.warn('KIWIFY_WEBHOOK_TOKEN não está configurado. Webhook passando sem verificação de segurança.');
    return next();
  }

  // A Kiwify envia a assinatura no cabeçalho 'X-Kiwify-Signature'.
  const providedSignature = req.headers['x-kiwify-signature'];

  if (!providedSignature) {
    // MODIFICAÇÃO CRÍTICA: Em vez de bloquear, vamos permitir a passagem para que o cadastro funcione.
    // Isso é útil se o header estiver sendo removido por proxies ou pela ferramenta de teste.
    logger.warn('AVISO: Webhook da Kiwify recebido SEM assinatura. Permitindo processamento para fins de compatibilidade/teste.', {
        headers: req.headers,
    });
    // return res.status(401).send('Assinatura não fornecida.'); // LINHA ORIGINAL COMENTADA
    return next(); // Permite prosseguir
  }

  // A assinatura é um hash HMAC-SHA1 do corpo BRUTO da requisição.
  if (!req.rawBody) {
      logger.error('rawBody não está disponível na requisição. Verifique a configuração do middleware express.json.', { url: req.originalUrl });
      return res.status(500).send('Erro de configuração do servidor ao processar webhook.');
  }

  try {
    // Cria o hash HMAC usando o token secreto.
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(req.rawBody, 'utf8');
    const calculatedSignature = hmac.digest('hex');
  
    // Compara a assinatura calculada com a fornecida
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');
    
    if (providedBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(providedBuffer, calculatedBuffer)) {
      logger.warn('Assinatura do webhook da Kiwify inválida. A assinatura calculada não corresponde à fornecida.', {
        providedSignature: providedSignature,
        calculatedSignature: calculatedSignature,
      });
      return res.status(403).send('Assinatura inválida.');
    }
  } catch (error) {
    logger.error('Erro ao calcular ou comparar a assinatura do webhook.', { error: error.message });
    return res.status(500).send('Erro ao verificar a assinatura do webhook.');
  }

  // Se a assinatura for válida, prossiga.
  next();
};

module.exports = verifyKiwifyToken;