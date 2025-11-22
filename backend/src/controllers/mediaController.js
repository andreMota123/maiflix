const mediaService = require('../services/mediaService');

// @desc    Upload an image to GCS
// @route   POST /api/media/upload
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const folder = req.body.folder || 'uploads';
    
    // Retorna tanto o path interno (para salvar no banco) quanto a URL temporária (para mostrar na tela)
    const result = await mediaService.processImage(req.file, folder);

    res.status(201).json({
      ok: true,
      gcsPath: result.gcsPath, // Salvar isso no MongoDB
      url: result.url          // Usar isso no <img src> imediatamente
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get signed URL for a GCS path
// @route   GET /api/media/image/:path(*)
// @access  Public (Protected by signed URL generation logic)
exports.getImageUrl = async (req, res, next) => {
  try {
    const gcsPath = req.params.path + (req.params[0] ? req.params[0] : ''); // Captura caminhos com barras
    
    const url = await mediaService.getSignedUrl(gcsPath);

    if (!url) {
      return res.status(404).json({ message: 'Imagem não encontrada ou expirada.' });
    }

    res.status(200).json({ url });
  } catch (error) {
    next(error);
  }
};