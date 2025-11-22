const mediaService = require('../services/mediaService');
const logger = require('../utils/logger');

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

exports.getImageUrl = async (req, res, next) => {
  try {
    // Captura o caminho completo após /media/image/
    // Ex: se URL é /media/image/products/foto.png, params[0] é "products/foto.png"
    const rawPath = req.params[0];

    if (!rawPath) {
        return res.status(400).json({ message: 'Caminho do arquivo não fornecido.' });
    }

    const gcsPath = decodeURIComponent(rawPath);
    
    const url = await mediaService.getSignedUrl(gcsPath);

    if (!url) {
      return res.status(404).json({ message: 'Imagem não encontrada ou erro ao gerar link.' });
    }

    res.status(200).json({ url });

  } catch (error) {
    logger.error(`Erro interno ao recuperar imagem:`, error);
    res.status(500).json({ message: 'Erro interno ao processar solicitação de imagem.' });
  }
};