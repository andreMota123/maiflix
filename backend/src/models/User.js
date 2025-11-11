const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  'e-mail': { // Campo correto no DB
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  senha: { // Campo correto no DB
    type: String,
    required: true,
    select: false,
  },
  papel: { // Campo correto no DB
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  statusAssinatura: { // Campo correto no DB
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive',
  },
  avatarUrl: {
    type: String,
    default: function() {
        return `https://i.pravatar.cc/150?u=${this['e-mail']}`;
    }
  },
}, { timestamps: true });

// Hook para criptografar a "senha" (em Português)
// Este é o ÚNICO lugar onde o hash deve ser feito.
userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para comparar a "senha" (em Português)
userSchema.methods.comparePassword = async function(candidatePassword) {
  // O bug de async/await está corrigido aqui
  return await bcrypt.compare(candidatePassword, this.senha);
};

const User = mongoose.model('User', userSchema, 'users'); 
module.exports = User;