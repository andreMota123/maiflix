const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const { protect } = require('../middlewares/authMiddleware');

// Configuração do Multer (Memória)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/media/upload
router.post('/upload', protect, upload.single('file'), mediaController.uploadImage);

// GET /api/media/image/* 
// Checklist 2: Rota Wildcard para permitir caminhos como "banners/arquivo.png"
router.get('/image/*', mediaController.getImageUrl);

module.exports = router;
