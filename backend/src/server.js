// Importa as ferramentas necessárias
const express = require('express');
const path = require('path');

// Inicializa o aplicativo "gerente"
const app = express();

// Define a porta. O Render nos dirá qual porta usar.
// Se não estiver no Render, usa a porta 3333
const PORT = process.env.PORT || 3333;

// --- A MÁGICA ACONTECE AQUI ---

// 1. Servir a "Vitrine" (O Frontend)
//    Isso diz ao Express para encontrar a pasta "dist" do seu frontend
//    Path: Sobe 2 níveis (de backend/src para a raiz) e entra em frontend/dist
const staticPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(staticPath));

// 2. Adicionar as rotas da sua API (Exemplos)
//    (No futuro, suas rotas de login, produtos, etc., virão aqui)
//    app.get('/api/produtos', (req, res) => { ... });
//    app.post('/api/login', (req, res) => { ... });

// 3. Rota "Coringa" (Catch-all)
//    Se o usuário recarregar a página (F5) em /perfil ou /comunidade,
//    este comando garante que o servidor envie o index.html do React,
//    e não dê um erro 404.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// --- Fim da Mágica ---

// 4. Ligar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Maiflix rodando na porta ${PORT}`);
});