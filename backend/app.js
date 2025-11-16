// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path'); // Importar o módulo path
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/db');

// --- Import Routes ---
const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminPostRoutes = require('./src/routes/adminPostRoutes');
const productRoutes = require('./src/routes/productRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const postRoutes = require('./src/routes/postRoutes'); // Nova rota da comunidade

// --- Connect to Database ---
connectDB();

const app = express();

// --- Core Middlewares ---
app.use(helmet()); 
app.use(cors({ origin: process.env.CORS_ORIGIN })); 
app.use(express.json()); 

// --- API Routes ---
app.get('/api', (req, res) => res.send('API Maiflix está no ar!'));
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin-posts', adminPostRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/posts', postRoutes); // Rota para posts da comunidade

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  // Define o caminho para a pasta de build do frontend
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  
  // Serve os arquivos estáticos do React
  app.use(express.static(frontendDistPath));

  // O "catchall" handler: para qualquer requisição que não corresponda a uma rota da API,
  // envia de volta o arquivo index.html do React.
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  });
}

// --- Centralized Error Handling Middleware ---
app.use((err, req, res, next) => {
  logger.error("Erro não tratado na rota", {
    message: err.message,
    stack: err.stack,
    request: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    },
  });
  res.status(500).json({ message: 'Algo deu errado no servidor!' });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
