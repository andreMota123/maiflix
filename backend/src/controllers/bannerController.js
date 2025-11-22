const Banner = require('../models/Banner');
const { getSignedUrl } = require('../services/mediaService');

const populateBannerUrl = async (banner) => {
  if (!banner) return null;
  const b = banner.toObject ? banner.toObject() : banner;
  if (b.imageUrl && !b.imageUrl.startsWith('http')) {
    b.imageUrl = await getSignedUrl(b.imageUrl);
  }
  return b;
};

exports.getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const bannersWithUrls = await Promise.all(banners.map(populateBannerUrl));
    res.status(200).json(bannersWithUrls);
  } catch (error) {
    next(error);
  }
};

exports.createBanner = async (req, res, next) => {
  const { title, subtitle, imageUrl, linkUrl } = req.body;
  try {
    const banner = await Banner.create({ title, subtitle, imageUrl, linkUrl });
    const bannerWithUrl = await populateBannerUrl(banner);
    res.status(201).json(bannerWithUrl);
  } catch (error) {
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) {
      return res.status(404).json({ message: 'Banner não encontrado.' });
    }
    const bannerWithUrl = await populateBannerUrl(banner);
    res.status(200).json(bannerWithUrl);
  } catch (error) {
    next(error);
  }
};

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