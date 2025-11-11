const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Corrigido para bater com o seu banco de dados
  'e-mail': {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // Corrigido para bater com o seu banco de dados
  senha: {
    type: String,
    required: true,
    select: false, // Não retorna a senha em queries por padrão
  },
  // Corrigido para bater com o seu banco de dados
  papel: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Corrigido para bater com o seu banco de dados
  statusAssinatura: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive',
  },
  avatarUrl: {
    type: String,
    default: function() {
        // Usa 'e-mail' para gerar a URL
        return `https://i.pravatar.cc/150?u=${this['e-mail']}`;
    }
  },
}, { timestamps: true });

// Hook para criptografar a "senha" (em Português)
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
  // 'this.senha' agora é o campo correto
  return await bcrypt.compare(candidatePassword, this.senha);
};

// Mapeia o modelo para a coleção 'users' existente
const User = mongoose.model('User', userSchema, 'users'); 
module.exports = User;