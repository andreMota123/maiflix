const mongoose = require('mongoose');

const adminPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const AdminPost = mongoose.model('AdminPost', adminPostSchema);
module.exports = AdminPost;
