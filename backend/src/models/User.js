const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Usando bcryptjs

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
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- A CORREÇÃO ESTÁ AQUI ---
// O método de instância precisa ser ASYNC e usar AWAIT.
userSchema.methods.comparePassword = async function(candidatePassword) {
  // 'this.password' refere-se à senha com hash do documento do usuário
  return await bcrypt.compare(candidatePassword, this.password);
};
// --- FIM DA CORREÇÃO ---

const User = mongoose.model('User', userSchema);
module.exports = User;