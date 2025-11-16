// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const logger = require('../src/utils/logger');

const createAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    logger.error('Por favor, defina ADMIN_EMAIL, ADMIN_PASSWORD, e ADMIN_NAME no seu arquivo .env');
    process.exit(1);
  }

  try {
    logger.info('Conectando ao banco de dados...');
    await mongoose.connect(process.env.DATABASE_URL);
    logger.info('Conectado ao MongoDB com sucesso!');
    
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      logger.info('Usuário administrador já existe. Verificando se precisa de atualização...');
      
      // Update fields if they are different
      let updated = false;
      if (existingAdmin.name !== ADMIN_NAME) {
        existingAdmin.name = ADMIN_NAME;
        updated = true;
      }
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        updated = true;
      }
      // You can also add logic to update password if needed, for now we just update name/role.
      // existingAdmin.password = ADMIN_PASSWORD; // The pre-save hook will hash it

      if(updated) {
        await existingAdmin.save();
        logger.info('Usuário administrador atualizado com sucesso.');
      } else {
        logger.info('Nenhuma atualização necessária para o administrador.');
      }

    } else {
      logger.info('Criando novo usuário administrador...');
      const adminUser = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // The pre-save hook will encrypt this
        role: 'admin',
        subscriptionStatus: 'active', // Admin always active
      });
      await adminUser.save();
      logger.info('Usuário administrador criado com sucesso.');
    }

  } catch (error) {
    logger.error('Ocorreu um erro durante o script de criação do admin:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    logger.info('Desconectando do banco de dados.');
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();