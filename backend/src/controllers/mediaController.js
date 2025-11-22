const mediaService = require('../services/mediaService');
const logger = require('../utils/logger');

// @desc    Upload an image to GCS
// @route   POST /api/media/upload
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const folder = req.body.folder || 'uploads';
    
    const result = await mediaService.processImage(req.file, folder);

    res.status(201).json({
      ok: true,
      gcsPath: result.gcsPath,
      url: result.url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get signed URL for a GCS path
// @route   GET /api/media/image/*
// @access  Public (Protegido pela assinatura da URL)
exports.getImageUrl = async (req, res, next) => {
  try {
    // Checklist 3: Pegar o caminho completo com req.params[0] e decodificar
    // Ex: se a url for /api/media/image/products/foto.png, req.params[0] é "products/foto.png"
    const rawPath = req.params[0];

    if (!rawPath) {
        return res.status(400).json({ message: 'Caminho do arquivo não fornecido.' });
    }

    const gcsPath = decodeURIComponent(rawPath);
    
    // Chama o serviço para gerar a URL
    const url = await mediaService.getSignedUrl(gcsPath);

    // Checklist 6: Tratamento de erro 404
    if (!url) {
      return res.status(404).json({ message: 'Imagem não encontrada.' });
    }

    // Checklist 5: Retorna JSON { url }
    res.status(200).json({ url });

  } catch (error) {
    // Checklist 6: Tratamento de erro 500
    logger.error(`Erro interno ao recuperar imagem:`, error);
    res.status(500).json({ message: 'Erro interno ao processar solicitação de imagem.' });
  }
};
