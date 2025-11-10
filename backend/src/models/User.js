const mongoose = require('mongoose');
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

// Hook (middleware) do Mongoose para criptografar a senha ANTES de salvar o documento.
// Este hook é acionado AUTOMATICAMENTE sempre que o método .save() é chamado em uma instância de User.
userSchema.pre('save', async function(next) {
  // Executa o código apenas se a senha foi modificada (ou é um novo usuário)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Gera o "salt" e faz o hash da senha de forma segura.
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método de instância para comparar a senha fornecida com a senha com hash no banco de dados.
// Este é o método correto e seguro para verificar o login.
userSchema.methods.comparePassword = function(candidatePassword) {
  // 'this.password' refere-se à senha com hash do documento do usuário
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;