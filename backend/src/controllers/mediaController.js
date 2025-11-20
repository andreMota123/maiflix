const mediaService = require('../services/mediaService');

// @desc    Upload an image
// @route   POST /api/media/upload
// @access  Private (Admin or User)
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const folder = req.body.folder || 'community'; // Default folder
    const url = await mediaService.processImage(req.file, folder);

    res.status(201).json({ url });
  } catch (error) {
    next(error);
  }
};