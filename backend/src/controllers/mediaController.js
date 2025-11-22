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
// @route   GET /api/media/image/*
// @access  Public (Protected by signed URL generation logic)
exports.getImageUrl = async (req, res, next) => {
  try {
    // req.params[0] captura tudo que vem depois de /image/
    // Ex: se a url for /api/media/image/products/foto.png, req.params[0] será "products/foto.png"
    const rawPath = req.params[0];

    if (!rawPath) {
        return res.status(400).json({ message: 'Caminho do arquivo não fornecido.' });
    }

    // Decodifica caracteres especiais (espaços, acentos) que o navegador possa ter codificado
    const gcsPath = decodeURIComponent(rawPath);
    
    const url = await mediaService.getSignedUrl(gcsPath);

    if (!url) {
      return res.status(404).json({ message: 'Imagem não encontrada ou expirada.' });
    }

    res.status(200).json({ url });
  } catch (error) {
    console.error("Erro no controller getImageUrl:", error);
    // Não expõe erro interno detalhado, mas retorna 500
    res.status(500).json({ message: 'Erro interno ao gerar URL da imagem.' });
  }
};