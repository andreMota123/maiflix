const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Checks for and removes a specific incorrect index ('e-mail_1') from the 'users' collection.
 * This is a one-time fix for a legacy database issue.
 */
const fixWrongIndex = async () => {
  try {
    const collection = mongoose.connection.db.collection('users');
    const indexes = await collection.indexes();

    const wrongIndexExists = indexes.some(index => index.name === 'e-mail_1');

    if (wrongIndexExists) {
      logger.info("Índice incorreto 'e-mail_1' encontrado. Removendo para corrigir problemas de cadastro...");
      await collection.dropIndex('e-mail_1');
      logger.info("Índice 'e-mail_1' removido com sucesso! O índice correto ('email_1') será criado automaticamente pelo Mongoose.");
    }
  } catch (error) {
    // If the index doesn't exist, dropIndex can throw an error. We can ignore it in that context.
    if (error.codeName === 'IndexNotFound') {
        logger.info("Tentativa de remover 'e-mail_1', mas o índice não foi encontrado (provavelmente já foi corrigido).");
    } else {
        // Log other errors but don't crash the server startup process.
        logger.error("Erro ao tentar remover o índice incorreto 'e-mail_1'. Isso pode não ser um erro fatal.", { message: error.message });
    }
  }
};

/**
 * Main function to run all database checks or migration tasks on server startup.
 */
const runDbMigrations = async () => {
  logger.info('Executando verificações de integridade do banco de dados na inicialização...');
  await fixWrongIndex();
  // Future migration tasks can be added here.
  logger.info('Verificações de integridade do banco de dados concluídas.');
};

module.exports = runDbMigrations;
