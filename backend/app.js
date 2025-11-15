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

// --- Import Routes ---
const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const userRoutes = require('./src/routes/userRoutes');

// --- Connect to Database ---
connectDB();

const app = express();

// --- Core Middlewares ---
app.use(helmet()); // Set security-related HTTP response headers
app.use(cors({ origin: process.env.CORS_ORIGIN })); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming requests with JSON payloads

// --- API Routes ---
app.get('/api', (req, res) => res.send('API Maiflix está no ar!'));
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);

// --- Serve Static Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
