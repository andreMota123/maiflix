const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    logger.info('Conectado ao MongoDB com sucesso!');
  } catch (err) {
    logger.error('Erro fatal ao conectar ao MongoDB. A aplicação será encerrada.', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
