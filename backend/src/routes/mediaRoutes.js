const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const { protect } = require('../middlewares/authMiddleware');

// Configuração do Multer (Armazenamento em memória para processamento com Sharp)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Rota de upload
// Aceita multipart/form-data com campo 'file' e 'folder'
router.post('/upload', protect, upload.single('file'), mediaController.uploadImage);

module.exports = router;