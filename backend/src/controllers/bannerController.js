const Banner = require('../models/Banner');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private
exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private/Admin
exports.createBanner = async (req, res, next) => {
  const { title, subtitle, imageUrl, linkUrl } = req.body;
  try {
    const banner = await Banner.create({ title, subtitle, imageUrl, linkUrl });
    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) {
      return res.status(404).json({ message: 'Banner não encontrado.' });
    }
    res.status(200).json(banner);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner não encontrado.' });
    }
    await Banner.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Banner removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};
