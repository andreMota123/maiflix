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
const runDbMigrations = require('./src/utils/runDbMigrations');

// --- Import Routes ---
const authRoutes = require('./src/routes/authRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminPostRoutes = require('./src/routes/adminPostRoutes');
const productRoutes = require('./src/routes/productRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const postRoutes = require('./src/routes/postRoutes');
const webhookLogRoutes = require('./src/routes/webhookLogRoutes');

const app = express();

// --- Core Middlewares ---
app.use(helmet()); 
app.use(cors({ origin: process.env.CORS_ORIGIN })); 

// To verify Kiwify's signature, we need the raw request body.
// We configure express.json() to capture it for webhook routes.
const captureRawBody = (req, res, buf, encoding) => {
  if (req.originalUrl.startsWith('/api/webhooks/kiwify')) {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      logger.error('Error capturing raw body for webhook', { error: e.message });
      req.rawBody = ''; // Handle error appropriately
    }
  }
};

// Use express.json with the verify option. This MUST come before any routes that need the raw body.
app.use(express.json({ verify: captureRawBody }));

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
app.use('/api/webhook-logs', webhookLogRoutes);

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  // Path to the frontend build directory
  const frontendDistPath = path.join(__dirname, '..', 'dist');
  
  // Serve static files from the React app
  app.use(express.static(frontendDistPath));

  // The "catchall" handler: for any request that doesn't match one above,
  // send back React's index.html file.
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
    // 2. Run database integrity checks and migrations (e.g., fix wrong indexes)
    await runDbMigrations();
    // 3. Setup the admin user automatically
    await setupAdmin();
    // 4. Start listening for requests
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor.', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();