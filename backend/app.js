// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/db');
const setupAdmin = require('./src/utils/setupAdmin');

// --- Import Routes ---
const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminPostRoutes = require('./src/routes/adminPostRoutes');
const productRoutes = require('./src/routes/productRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const postRoutes = require('./src/routes/postRoutes');

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
app.use('/api/posts', postRoutes);

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));
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

const startServer = async () => {
  try {
    // 1. Connect to the database
    await connectDB();
    // 2. Setup the admin user automatically
    await setupAdmin();
    // 3. Start listening for requests
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor.', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
