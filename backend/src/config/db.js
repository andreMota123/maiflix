const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 20000, // Aumenta o tempo de espera para seleção do servidor
      socketTimeoutMS: 45000, // Aumenta o tempo de espera para sockets inativos
    });
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
