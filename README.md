# Maiflix - Plataforma de Assinatura para Criativos

Maiflix é uma plataforma de assinatura completa para criativos, oferecendo acesso a ativos digitais, aulas e uma comunidade vibrante. Este projeto está 100% pronto para produção, com um backend Node.js/Express e um frontend React/Vite.

## Estrutura do Projeto

- **/backend**: API Node.js/Express que se conecta ao MongoDB Atlas e serve a aplicação React em produção.
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
3.  Edite o arquivo `.env` e preencha a variável `DATABASE_URL` com sua string de conexão do MongoDB Atlas. Adicione também `ADMIN_EMAIL`, `ADMIN_PASSWORD`, e `ADMIN_NAME` для o admin local.
4.  Instale as dependências: `npm install`
5.  Inicie o servidor de desenvolvimento: `npm run dev`
    -   A API estará rodando em `http://localhost:5000`. O usuário admin será criado automaticamente na primeira inicialização.

### Frontend

1.  Em outro terminal, navegue até a pasta `frontend`: `cd frontend`
2.  Instale as dependências: `npm install`
3.  Inicie o servidor de desenvolvimento: `npm run dev`
    -   A aplicação estará acessível em `http://localhost:5173`. O Vite irá automaticamente usar o proxy configurado para redirecionar chamadas de API para `localhost:5000`.

---

## 4. Deploy no Render (Método Simplificado)

Nesta abordagem, usaremos um único **Web Service** no Render que irá construir e servir tanto o backend quanto o frontend.

1.  Vá para o seu [Dashboard do Render](https://dashboard.render.com/) e clique em **New > Web Service**.
2.  Conecte seu repositório do GitHub.
3.  Configure o serviço:
    -   **Name**: `maiflix` (ou seu nome preferido)
    -   **Root Directory**: (deixe em branco)
    -   **Environment**: `Node`
    -   **Region**: Escolha a mais próxima de você.
    -   **Build Command**: `npm install --prefix frontend --production=false && npm run build --prefix frontend && npm install --prefix backend`
    -   **Start Command**: `node backend/app.js`
4.  Clique em **Advanced** e adicione as **Environment Variables**:
    -   `NODE_ENV`: `production`
    -   `DATABASE_URL`: Sua string de conexão do MongoDB Atlas.
    -   `JWT_SECRET`: Uma chave secreta longa e segura (ex: use um gerador de senhas).
    -   `CORS_ORIGIN`: O URL da sua aplicação no Render (ex: `https://maiflix.onrender.com`).
    -   `ADMIN_EMAIL`: `levitamota@gmail.com`
    -   `ADMIN_PASSWORD`: `Andre9157$`
    -   `ADMIN_NAME`: `Administrador`
    -   (Opcional) Configure as variáveis `EMAIL_*` se desejar habilitar o envio de emails.
5.  Clique em **Create Web Service**.

**Importante:** Na primeira vez que o serviço iniciar em produção, ele criará automaticamente o usuário administrador no seu banco de dados usando as variáveis `ADMIN_*` que você definiu. Você não precisa executar nenhum comando adicional.

Após o primeiro deploy, que pode demorar alguns minutos, sua aplicação Maiflix estará 100% online e funcional no URL fornecido pelo Render.