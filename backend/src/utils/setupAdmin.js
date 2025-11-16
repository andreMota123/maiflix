const User = require('../models/User');
const logger = require('./logger');

const setupAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    logger.warn('Variáveis de ambiente do administrador (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME) não estão definidas. Pulando a criação automática do admin.');
    return;
  }

  try {
    const adminEmail = ADMIN_EMAIL.toLowerCase();
    // Find user but also select the passwordHash which is not selected by default
    const existingAdmin = await User.findOne({ email: adminEmail }).select('+passwordHash');

    if (!existingAdmin) {
      // Admin doesn't exist, create it.
      logger.info('Nenhum usuário administrador encontrado. Criando um novo...');
      const adminUser = new User({
        name: ADMIN_NAME,
        email: adminEmail,
        password: ADMIN_PASSWORD,
        role: 'admin',
        subscriptionStatus: 'active',
      });
      await adminUser.save();
      logger.info(`Usuário administrador "${ADMIN_NAME}" <${adminEmail}> criado com sucesso.`);
    } else {
      // Admin exists, check if password is correct.
      // This will fix cases where the admin was created without a valid password hash.
      const isPasswordCorrect = await existingAdmin.comparePassword(ADMIN_PASSWORD);
      
      if (isPasswordCorrect) {
        logger.info('Usuário administrador já existe e a senha está correta. Nenhuma ação necessária.');
      } else {
        logger.warn('A senha do administrador no banco de dados está incorreta ou ausente. Atualizando para a senha definida nas variáveis de ambiente...');
        existingAdmin.password = ADMIN_PASSWORD; // Use the virtual setter to re-hash
        await existingAdmin.save();
        logger.info('Senha do administrador atualizada com sucesso.');
      }
    }

  } catch (error) {
    logger.error('Ocorreu um erro durante a configuração do administrador:', {
      message: error.message,
      stack: error.stack,
    });
    // Não para a aplicação, apenas loga o erro.
  }
};

module.exports = setupAdmin;
