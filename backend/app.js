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
const { sendWelcomeEmail } = require('./src/utils/emailService');

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
const mediaRoutes = require('./src/routes/mediaRoutes'); // Nova rota de mídia

const app = express();

// --- Core Middlewares ---
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite carregar imagens de outros domínios/localhost
})); 
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); 

// Serve arquivos estáticos da pasta 'public' (onde as imagens serão salvas)
app.use(express.static(path.join(__dirname, 'public')));

// To verify Kiwify's signature, we need the raw request body.
const captureRawBody = (req, res, buf, encoding) => {
  if (req.originalUrl.startsWith('/api/webhooks/')) {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      logger.error('Error capturing raw body for webhook', { error: e.message });
      req.rawBody = ''; 
    }
  }
};

app.use(express.json({ verify: captureRawBody }));

// --- API Routes ---
app.get('/api', (req, res) => res.send('API Maiflix está no ar!'));

app.get('/api/test-email', async (req, res) => {
    try {
        const emailDestino = process.env.EMAIL_USER; 
        await sendWelcomeEmail(emailDestino, 'Teste Admin', 'senha-teste-123');
        res.send(`E-mail de teste enviado para ${emailDestino}. Verifique sua caixa de entrada (e spam).`);
    } catch (error) {
        res.status(500).send(`Erro ao enviar e-mail: ${error.message}`);
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin-posts', adminPostRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/webhook-logs', webhookLogRoutes);
app.use('/api/media', mediaRoutes); // Registra rotas de mídia

// --- Serve Frontend in Production ---
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    const indexPath = path.resolve(frontendDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error("Erro ao enviar index.html do frontend", {
          message: err.message,
          path: indexPath,
        });
        res.status(500).send("Não foi possível carregar a aplicação.");
      }
    });
  });
}

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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await runDbMigrations();
    await setupAdmin();
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor.', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();