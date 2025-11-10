// Carrega variáveis de ambiente
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('./src/utils/logger');
const User = require('./src/models/User');
const bcrypt = require('bcrypt'); // A importação pode ficar, não tem problema

const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');

const app = express();

const createDefaultAdmin = async () => {
  try {
    // MUDANÇA 1: Novo email para forçar a criação
    const adminEmail = 'levitamota+admin3@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      
      // MUDANÇA 2: Voltamos a salvar como texto puro (o User.js vai criptografar)
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: 'Andre9157$', // O hook pre-save no model irá fazer o hash
        role: 'admin',
        subscriptionStatus: 'active',
      });
      await adminUser.save();
      logger.info('Usuário administrador padrão (admin3) criado com sucesso.');
    }
  } catch (error) {
    logger.error('Erro ao criar usuário administrador padrão.', {
      message: error.message,
      stack: error.stack,
    });
  }
};

// ... (O resto do seu app.js continua igual daqui para baixo) ...
// --- Conexão com o Banco de Dados ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    logger.info("Conectado ao MongoDB com sucesso!");
    createDefaultAdmin();
  })
  .catch(err => {
    logger.error("Erro fatal ao conectar ao MongoDB. A aplicação será encerrada.", {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

// --- Middlewares Essenciais ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// --- Rotas da API ---
app.get('/api', (req, res) => res.send('API Maiflix está no ar!'));
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api', protectedRoutes);

// --- Servir o Frontend Estático ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

// --- Middleware de Tratamento de Erros ---
app.use((err, req, res, next) => {
  logger.error("Erro não tratado na rota", {
    message: err.message,
    stack: err.stack,
    request: { url: req.originalUrl, method: req.method },
  });
  res.status(500).json({ message: 'Algo deu errado no servidor!' });
});

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});