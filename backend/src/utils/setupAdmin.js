const User = require('../models/User');
const logger = require('./logger');

const setupAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    logger.warn('Variáveis de ambiente do administrador (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME) não estão definidas. Pulando a criação automática do admin.');
    return;
  }

  try {
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      logger.info('Usuário administrador já existe. Nenhuma ação necessária.');
      return;
    }

    logger.info('Nenhum usuário administrador encontrado. Criando um novo...');
    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // O hook pre-save fará o hash
      role: 'admin',
      subscriptionStatus: 'active', // Admin sempre ativo
    });
    await adminUser.save();
    logger.info(`Usuário administrador "${ADMIN_NAME}" <${ADMIN_EMAIL}> criado com sucesso.`);

  } catch (error) {
    logger.error('Ocorreu um erro durante a configuração do administrador:', {
      message: error.message,
      stack: error.stack,
    });
    // Não para a aplicação, apenas loga o erro.
  }
};

module.exports = setupAdmin;
