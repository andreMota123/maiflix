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
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true },
});

// Add a virtual property for 'password'
// This allows us to set user.password = '...' and it will get hashed
userSchema.virtual('password').set(function(password) {
  if (password && password.length >= 6) {
    this._password = password; // Temporary storage
    // This sets the actual passwordHash field, which will then trigger the pre-save hook
    this.passwordHash = password;
  }
});

// Mongoose hook to hash password BEFORE saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    // this.passwordHash currently holds the plain text password from the virtual setter
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch(error) {
    return next(error);
  }
});

// Method to compare candidate password with the hashed password in the DB
userSchema.methods.comparePassword = function(candidatePassword) {
  // Add a check to prevent crash if passwordHash is missing for some reason
  if (!this.passwordHash || !candidatePassword) {
      return Promise.resolve(false);
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;