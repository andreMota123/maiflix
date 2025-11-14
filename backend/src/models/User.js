const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // MUDANÇA: 'email' para 'e-mail' para corresponder ao banco de dados.
  'e-mail': {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // MUDANÇA: 'password' para 'senha'.
  senha: {
    type: String,
    required: true,
    select: false, // Não retorna a senha em queries por padrão
  },
  // MUDANÇA: 'role' para 'papel'.
  papel: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // MUDANÇA: 'subscriptionStatus' para 'statusAssinatura'.
  statusAssinatura: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive',
  },
  avatarUrl: {
    type: String,
    default: function() {
        // MUDANÇA: Usar 'this.e-mail' para gerar o avatar.
        return `https://i.pravatar.cc/150?u=${this['e-mail']}`;
    }
  },
}, { timestamps: true });

// MUDANÇA: Hook do Mongoose para criptografar a 'senha' ANTES de salvar.
userSchema.pre('save', async function(next) {
  // Executa o código apenas se a 'senha' foi modificada
  if (!this.isModified('senha')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// MUDANÇA: Método para comparar a senha fornecida com a 'senha' com hash no banco de dados.
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.senha);
};

const User = mongoose.model('User', userSchema);
module.exports = User;