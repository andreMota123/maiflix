const mongoose = require('mongoose');
// GARANTIA: Usando 'bcryptjs' de forma consistente, conforme definido no package.json.
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Não retorna a senha em queries por padrão
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive',
  },
  avatarUrl: {
    type: String,
    default: function() {
        return `https://i.pravatar.cc/150?u=${this.email}`;
    }
  },
}, { timestamps: true });

// Hook do Mongoose para criptografar a senha ANTES de salvar, usando bcryptjs.
// É acionado automaticamente pelo método .save().
userSchema.pre('save', async function(next) {
  // Executa o código apenas se a senha foi modificada (ou é um novo usuário)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Gera o "salt" e faz o hash da senha de forma segura com bcryptjs.
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método de instância para comparar a senha fornecida com a senha com hash no banco de dados, usando bcryptjs.
userSchema.methods.comparePassword = function(candidatePassword) {
  // 'this.password' refere-se à senha com hash do documento do usuário.
  // bcrypt.compare retorna uma promessa, que será resolvida com 'await' no controller.
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
