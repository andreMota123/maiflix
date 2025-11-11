// Carrega variáveis de ambiente em desenvolvimento. Em produção (cPanel), elas são injetadas.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // Importar o módulo 'path'
const logger = require('./src/utils/logger');
const User = require('./src/models/User');

const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');

const app = express();

// ... (outras importações)
const bcrypt = require('bcryptjs'); 
// ...

const createDefaultAdmin = async () => {
  try {
    // MUDANÇA: Novo email para forçar a recriação
    const adminEmail = 'levitamota+final@gmail.com'; 
    // Corrigido: Procura por 'e-mail'
    const existingAdmin = await User.findOne({ 'e-mail': adminEmail });

    if (!existingAdmin) {
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Andre9157$', salt);

      // Corrigido: Cria o admin com os campos em Português
      const adminUser = new User({
        name: 'Admin',
        'e-mail': adminEmail,
        senha: hashedPassword,
        papel: 'admin',
        statusAssinatura: 'active',
        avatarUrl: `https://i.pravatar.cc/150?u=${adminEmail}` // Adicionado para consistência
      });
      await adminUser.save();
      logger.info('Usuário administrador (em PT) criado com sucesso.');
    }
  } catch (error) {
    logger.error('Erro ao criar usuário administrador padrão.', {
      message: error.message,
      stack: error.stack,
    });
  }
};
// ... (o resto do app.js)

// --- Conexão com o Banco de Dados ---
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    logger.info("Conectado ao MongoDB com sucesso!");
    // Garante que o admin seja verificado/criado após a conexão
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
app.use(helmet()); // Define headers de segurança
app.use(cors({ origin: process.env.CORS_ORIGIN })); // Permite requisições do seu frontend
app.use(express.json()); // Parser para payloads JSON

// --- Rotas da API ---
app.get('/api', (req, res) => res.send('API Maiflix está no ar!'));
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api', protectedRoutes);

// --- Servir o Frontend Estático ---
// Apenas em produção, sirva os arquivos buildados do frontend
if (process.env.NODE_ENV === 'production') {
  // Define o caminho para a pasta de build do frontend
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Para qualquer outra rota que não seja da API, sirva o index.html do frontend
  // Isso permite que o roteamento do lado do cliente (React Router) funcione
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
}

// --- Middleware de Tratamento de Erros ---
// Este middleware captura todos os erros que ocorrem nas rotas
app.use((err, req, res, next) => {
  // Log detalhado do erro, incluindo informações da requisição
  logger.error("Erro não tratado na rota", {
    message: err.message,
    stack: err.stack,
    request: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      headers: req.headers,
      body: req.body, // Cuidado: pode conter informações sensíveis. Em produção, considere omitir ou filtrar.
    },
  });
  res.status(500).json({ message: 'Algo deu errado no servidor!' });
});

// --- Inicialização do Servidor ---
// O cPanel/Passenger injeta a variável de ambiente PORT
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});