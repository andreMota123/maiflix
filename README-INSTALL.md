# Guia de Instalação e Deploy - Maiflix no cPanel

Este guia contém todas as instruções para colocar a API (backend) e a aplicação (frontend) do Maiflix no ar em um ambiente cPanel.

## Estrutura do Projeto

- **/backend**: Contém a API Node.js. Deve ser compactado como `backend.zip`.
- **/frontend**: Contém a aplicação React (Vite). Após o build, o conteúdo da pasta `/dist` deve ser compactado como `frontend.zip`.

---

## 1. Deploy do Backend (API)

**Subdomínio de destino:** `api.sublimepapelaria.com.br`

### Passo 1: Preparar o Arquivo
1.  Na sua máquina, navegue até a pasta `backend`.
2.  **Não** rode `npm install` aqui. O cPanel fará isso.
3.  Compacte todo o conteúdo da pasta `backend` em um arquivo chamado `backend.zip`.

### Passo 2: Configurar o Subdomínio no cPanel
1.  Acesse seu cPanel.
2.  Vá para **Domínios** e crie o subdomínio `api.sublimepapelaria.com.br`. Anote o "Diretório Raiz" que ele criar (ex: `/home/seu_usuario/api.sublimepapelaria.com.br`).

### Passo 3: Fazer Upload e Extrair
1.  Vá para o **Gerenciador de Arquivos**.
2.  Navegue até o "Diretório Raiz" do subdomínio `api`.
3.  Clique em **Carregar**, envie o `backend.zip` e depois extraia seu conteúdo.

### Passo 4: Configurar a Aplicação Node.js
1.  Volte ao painel do cPanel, vá para **Software -> Setup Node.js App**.
2.  Clique em **CREATE APPLICATION**.
3.  Preencha o formulário:
    -   **Node.js version:** `18.x.x` ou superior.
    -   **Application mode:** `Production`.
    -   **Application root:** Selecione o diretório raiz do subdomínio `api`.
    -   **Application URL:** Selecione `api.sublimepapelaria.com.br`.
    -   **Application startup file:** Digite `app.js`.
4.  Clique em **CREATE**.

### Passo 5: Instalar Dependências e Definir Variáveis
1.  Na página da aplicação que acabou de ser criada, role para baixo e clique em **Run NPM Install**. Aguarde a conclusão.
2.  Mais abaixo, na seção **Environment Variables**, adicione as seguintes variáveis:
    -   `NODE_ENV`: `production`
    -   `DATABASE_URL`: `SUA_STRING_DE_CONEXAO_COM_MONGODB_ATLAS`
    -   `JWT_SECRET`: `UMA_CHAVE_SECRETA_MUITO_LONGA_E_SEGURA_COM_MAIS_DE_32_CARACTERES`
    -   `CORS_ORIGIN`: `https://maiflix.sublimepapelaria.com.br`
3.  Clique em **Save**.

### Passo 6: Iniciar e Verificar
1.  No topo da página, clique em **START APP**.
2.  Abra `https://api.sublimepapelaria.com.br/api` no seu navegador. Você deve ver a mensagem: `API Maiflix está no ar!`.

---

## 2. Deploy do Frontend (React App)

**Subdomínio de destino:** `maiflix.sublimepapelaria.com.br`

### Passo 1: Fazer o Build do Projeto
1.  Na sua máquina, navegue até a pasta `frontend`.
2.  Crie um arquivo `.env` a partir do `.env.example`. Dentro dele, adicione a linha:
    `VITE_API_URL=https://api.sublimepapelaria.com.br/api`
3.  Abra o terminal e rode os comandos:
    ```bash
    npm install
    npm run build
    ```
4.  Isso criará uma pasta chamada `dist` dentro de `frontend`.

### Passo 2: Preparar e Fazer Upload
1.  Entre na pasta `dist`.
2.  Selecione **todos os arquivos e pastas dentro de `dist`** e compacte-os em um arquivo chamado `frontend.zip`.
3.  No cPanel, vá para o **Gerenciador de Arquivos** e navegue até o diretório raiz do subdomínio `maiflix.sublimepapelaria.com.br`.
4.  Carregue e extraia o `frontend.zip`.

### Passo 3: Verificar
1.  Acesse `https://maiflix.sublimepapelaria.com.br`. A página de login deve aparecer.
2.  Tente fazer login com um usuário que tenha assinatura ativa no seu banco de dados.

---

## 3. Pós-Deploy e Testes

### Ativar SSL
-   No cPanel, vá para **Segurança -> SSL/TLS Status**.
-   Verifique se ambos os subdomínios (`maiflix` e `api`) estão com cadeados verdes. Se não estiverem, selecione-os e clique em **Run AutoSSL**.

### Testar Webhook da Kiwify
1.  Na sua conta da Kiwify, vá para a seção de webhooks.
2.  Adicione um novo endpoint com a URL: `https://api.sublimepapelaria.com.br/api/webhooks/kiwify`.
3.  Use a ferramenta de teste da Kiwify para enviar um evento de `order.paid`.
4.  Verifique os logs da sua aplicação Node.js no cPanel para confirmar o recebimento e o processamento.

### Verificando Logs
-   A API usa um sistema de log estruturado (Winston) para registrar eventos e erros.
-   **Logs de Erro Detalhados:** Em caso de falha, o sistema registrará a mensagem de erro, a stack trace, e detalhes da requisição que causou o problema (URL, método, headers e body), facilitando a identificação da causa raiz.
-   **Onde Encontrar:** Para depurar, verifique os logs da sua aplicação Node.js no cPanel (na página **Setup Node.js App**). Eles estarão em formato JSON, facilitando a busca por `"level":"error"` para encontrar problemas rapidamente.

### Futuras Atualizações
-   **Backend**: Pare a aplicação Node.js, suba o novo `backend.zip`, extraia, rode `NPM Install` (se houver novas dependências) e inicie a aplicação novamente.
-   **Frontend**: Faça um novo build (`npm run build`), compacte o conteúdo da pasta `dist` e substitua os arquivos antigos no servidor.
