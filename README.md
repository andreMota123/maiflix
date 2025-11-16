# Maiflix - Plataforma de Assinatura para Criativos

Maiflix é uma plataforma de assinatura completa para criativos, oferecendo acesso a ativos digitais, aulas e uma comunidade vibrante. Este projeto está 100% pronto para produção, com um backend Node.js/Express e um frontend React/Vite.

## Estrutura do Projeto

- **/backend**: API Node.js/Express que se conecta ao MongoDB Atlas.
- **/frontend**: Aplicação React (Vite) que consome a API.

---

## 1. Pré-requisitos

- **Node.js**: v18.x ou superior
- **npm**: v8.x ou superior
- **Git**
- **Conta no Render**
- **Conta no MongoDB Atlas**

---

## 2. Configuração do MongoDB Atlas

1.  Crie uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Crie um novo Cluster (o tier M0 é gratuito).
3.  Na seção **Database Access**, crie um usuário de banco de dados com senha. Anote o usuário e a senha.
4.  Na seção **Network Access**, adicione o IP `0.0.0.0/0` para permitir conexões de qualquer lugar (incluindo o Render).
5.  Volte para a visão geral do Cluster, clique em **Connect**, selecione "Drivers", e copie a **Connection String**. Substitua `<username>`, `<password>` pelos dados que você criou.

---

## 3. Configuração Local

### Backend

1.  Navegue até a pasta `backend`: `cd backend`
2.  Crie um arquivo `.env` a partir do exemplo: `cp .env.example .env`
3.  Edite o arquivo `.env` e preencha as variáveis:
    -   `DATABASE_URL`: Sua string de conexão do MongoDB Atlas.
    -   `CORS_ORIGIN`: Para desenvolvimento local, use `http://localhost:5173`.
4.  Instale as dependências: `npm install`
5.  Inicie o servidor de desenvolvimento: `npm run dev`
    -   A API estará rodando em `http://localhost:5000`.

### Frontend

1.  Em outro terminal, navegue até a pasta `frontend`: `cd frontend`
2.  Crie um arquivo `.env` a partir do exemplo: `cp .env.example .env`
3.  Edite o arquivo `.env` e preencha a variável:
    -   `VITE_API_URL=http://localhost:5000/api`
4.  Instale as dependências: `npm install`
5.  Inicie o servidor de desenvolvimento: `npm run dev`
    -   A aplicação estará acessível em `http://localhost:5173`.

---

## 4. Deploy no Render

### Backend (Web Service)

1.  Vá para o seu [Dashboard do Render](https://dashboard.render.com/) e clique em **New > Web Service**.
2.  Conecte seu repositório do GitHub.
3.  Configure o serviço:
    -   **Name**: `maiflix-backend` (ou seu nome preferido)
    -   **Root Directory**: `backend`
    -   **Environment**: `Node`
    -   **Region**: Escolha a mais próxima de você.
    -   **Build Command**: `npm install`
    -   **Start Command**: `node app.js`
4.  Clique em **Advanced** e adicione as **Environment Variables**:
    -   `NODE_ENV`: `production`
    -   `DATABASE_URL`: Sua string de conexão do MongoDB Atlas.
    -   `JWT_SECRET`: Uma chave secreta longa e segura (ex: use um gerador de senhas).
    -   `CORS_ORIGIN`: O URL do seu frontend no Render (ex: `https://maiflix-app.onrender.com`).
    -   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: Credenciais para o usuário admin inicial.
    -   (Opcional) Configure as variáveis `EMAIL_*` se desejar habilitar o envio de emails.
5.  Clique em **Create Web Service**. O deploy começará automaticamente.

### Frontend (Static Site)

1.  No Dashboard do Render, clique em **New > Static Site**.
2.  Conecte o mesmo repositório do GitHub.
3.  Configure o site:
    -   **Name**: `maiflix-app` (ou seu nome preferido)
    -   **Root Directory**: `frontend`
    -   **Build Command**: `npm run build`
    -   **Publish Directory**: `dist`
4.  Clique em **Advanced** e adicione a **Environment Variable**:
    -   `VITE_API_URL`: O URL do seu backend no Render (ex: `https://maiflix-backend.onrender.com/api`).
5.  Clique em **Create Static Site**.

Após o deploy, sua aplicação Maiflix estará 100% online e funcional!
