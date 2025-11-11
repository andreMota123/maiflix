const User = require('../models/User');
const logger = require('../utils/logger');
// Nota: Não precisamos mais importar o bcrypt aqui, 
// pois o User.js é que deve fazer a criptografia.

// Função para ATIVAR ou CRIAR assinatura de um usuário
const activateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de ativar assinatura sem email do cliente.");
    return;
  }
  const email = customerEmail.toLowerCase();
  
  // A SENHA EM TEXTO PURO. O User.js (modelo) vai criptografar.
  const defaultPassword = 'mudar123'; 

  try {
    // Corrigido: Procura o usuário pelo campo em Português 'e-mail'
    let user = await User.findOne({ 'e-mail': email });

    if (user) {
      // 1. Usuário já existe, apenas reativa a assinatura
      user.statusAssinatura = 'active';
      await user.save(); // O hook 'pre-save' não roda se a senha não for modificada
      logger.info('Assinatura RE-ativada com sucesso', { customerEmail: email });
    
    } else {
      // 2. Usuário NÃO existe, precisamos CRIAR um novo
      logger.info('Novo usuário. Criando conta de assinante...', { customerEmail: email });
      
      // CRIAÇÃO COM SENHA EM TEXTO PURO (Confiança no User.js)
      const newUser = new User({
        name: email.split('@')[0], // Um nome padrão
        'e-mail': email,
        senha: defaultPassword, // <--- TEXTO PURO AQUI
        papel: 'user', 
        statusAssinatura: 'active'
      });
      
      // O 'pre-save' hook no User.js vai ser ativado AQUI e criptografar a senha
      await newUser.save(); 
      logger.info('Novo assinante (SOLUÇÃO) criado com sucesso.', { customerEmail: email });
    }
  } catch (error) {
    logger.error('Erro ao ativar/criar assinatura no banco de dados.', {
      customerEmail: email,
      errorMessage: error.message,
      stack: error.stack
    });
  }
};

// Função para desativar a assinatura (também corrigida para usar campos em PT)
const deactivateSubscription = async (customerEmail) => {
  if (!customerEmail) {
    logger.warn("Tentativa de desativar assinatura sem email do cliente.");
    return;
  }
  try {
    // Corrigido: Busca por 'e-mail' e atualiza 'statusAssinatura'.
    const user = await User.findOneAndUpdate(
      { 'e-mail': customerEmail.toLowerCase() },
      { statusAssinatura: 'inactive' },
      { new: true }
    );
    if (user) {
      logger.info('Assinatura desativada com sucesso', { customerEmail, userId: user._id });
    } else {
      logger.warn('Webhook de cancelamento/reembolso recebido, mas usuário não foi encontrado.', { customerEmail });
    }
  } catch (error) {
    logger.error('Erro ao desativar assinatura no banco de dados.', {
      customerEmail,
      errorMessage: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  activateSubscription,
  deactivateSubscription,
};