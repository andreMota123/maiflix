const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['SVG', 'PDF', 'STUDIO'],
    required: true,
  },
  downloadUrl: {
    type: String,
    required: true,
  },
  youtubeUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
