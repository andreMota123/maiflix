const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Do not return password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'deleted'],
    default: 'active',
  },
  avatarUrl: {
    type: String,
    default: function() {
        // Generate a more professional avatar with user's initials
        const encodedName = encodeURIComponent(this.name);
        return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff`;
    }
  },
}, { timestamps: true });

// Mongoose hook to hash password BEFORE saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare candidate password with the hashed password in the DB
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;