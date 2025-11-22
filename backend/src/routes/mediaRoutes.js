const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const { protect } = require('../middlewares/authMiddleware');

// Configuração do Multer (Armazenamento em memória)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// POST /api/media/upload
router.post('/upload', protect, upload.single('file'), mediaController.uploadImage);

// GET /api/media/image/*
// O uso do wildcard (*) permite capturar caminhos complexos como "products/2024/imagem.webp"
// O valor capturado estará em req.params[0]
router.get('/image/*', mediaController.getImageUrl);

module.exports = router;