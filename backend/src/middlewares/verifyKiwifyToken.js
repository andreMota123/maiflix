const logger = require('../utils/logger');

const verifyKiwifyToken = (req, res, next) => {
  const token = process.env.KIWIFY_WEBHOOK_TOKEN;

  // Se o token não estiver configurado no servidor, pula a verificação.
  // Facilita o desenvolvimento local sem a necessidade do token.
  if (!token) {
    logger.warn('KIWIFY_WEBHOOK_TOKEN não está configurado no servidor. Webhook passando sem verificação de segurança.');
    return next();
  }

  // Kiwify envia o token no header 'x-kiwify-webhook-token'
  const providedToken = req.headers['x-kiwify-webhook-token'];

  if (!providedToken) {
    logger.warn('Webhook da Kiwify recebido sem o token no header "x-kiwify-webhook-token".');
    return res.status(401).send('Token de autenticação não fornecido.');
  }

  if (providedToken !== token) {
    logger.warn('Webhook da Kiwify recebido com token inválido.');
    return res.status(403).send('Token de autenticação inválido.');
  }

  // Se o token for válido, continua para o processamento do webhook.
  next();
};

module.exports = verifyKiwifyToken;
