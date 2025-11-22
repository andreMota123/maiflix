const Product = require('../models/Product');
const { getSignedUrl } = require('../services/mediaService');

// Helper para injetar URL assinada
const populateProductUrls = async (product) => {
  if (!product) return null;
  const p = product.toObject ? product.toObject() : product;
  if (p.thumbnailUrl && !p.thumbnailUrl.startsWith('http')) {
    p.thumbnailUrl = await getSignedUrl(p.thumbnailUrl);
  }
  return p;
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Gera URLs assinadas para todos os produtos
    const productsWithUrls = await Promise.all(products.map(populateProductUrls));
    res.status(200).json(productsWithUrls);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    // req.body.thumbnailUrl virá como 'products/arquivo.webp' do frontend
    const product = await Product.create(req.body);
    const productWithUrl = await populateProductUrls(product);
    res.status(201).json(productWithUrl);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    const productWithUrl = await populateProductUrls(product);
    res.status(200).json(productWithUrl);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    await Product.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Produto removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};