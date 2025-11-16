# Guia de Instalação e Deploy - Maiflix no cPanel

Este guia contém as instruções para colocar o Maiflix (API e Frontend) no ar em um ambiente cPanel usando uma abordagem de deploy unificado.

## Estrutura do Projeto

- **/backend**: Contém a API Node.js.
- **/frontend**: Contém a aplicação React (Vite).

Nesta abordagem, o backend Node.js será responsável por servir tanto a API (em rotas `/api/*`) quanto a aplicação React (em todas as outras rotas). Isso simplifica o processo, exigindo a configuração de apenas um subdomínio e uma aplicação Node.js.

---

## 1. Deploy da Aplicação Unificada

**Subdomínio de destino:** `maiflix.sublimepapelaria.com.br`

### Passo 1: Preparar os Arquivos
1.  Na sua máquina, navegue até a pasta `frontend`.
2.  Abra o terminal e rode os comandos para gerar a versão de produção:
    ```bash
    npm install
    npm run build
    ```
3.  Isso criará uma pasta `dist` dentro de `frontend`.
4.  Agora, na raiz do projeto, selecione as pastas `backend` e `frontend` (com a pasta `dist` dentro dela) e compacte-as em um único arquivo, como `maiflix-deploy.zip`.

### Passo 2: Configurar o Subdomínio e Fazer Upload
1.  Acesse seu cPanel.
2.  Vá para **Domínios** e crie o subdomínio `maiflix.sublimepapelaria.com.br`. Anote o "Diretório Raiz" que ele criar.
3.  Vá para o **Gerenciador de Arquivos**, navegue até o "Diretório Raiz" do subdomínio.
4.  Clique em **Carregar**, envie o `maiflix-deploy.zip` e depois extraia seu conteúdo. Você deverá ter as pastas `backend` e `frontend` no diretório.

### Passo 3: Configurar a Aplicação Node.js
1.  Volte ao painel do cPanel, vá para **Software -> Setup Node.js App**.
2.  Clique em **CREATE APPLICATION**.
3.  Preencha o formulário:
    -   **Node.js version:** `18.x.x` ou superior.
    -   **Application mode:** `Production`.
    -   **Application root:** Selecione o diretório raiz do subdomínio `maiflix`.
    -   **Application URL:** Selecione `maiflix.sublimepapelaria.com.br`.
    -   **Application startup file:** Digite `backend/app.js`.
4.  Clique em **CREATE**.

### Passo 4: Instalar Dependências e Definir Variáveis
1.  Na página da aplicação que acabou de ser criada, role para baixo. Primeiro, clique em **Run NPM Install** na seção "NPM". No campo que aparece, digite `backend` e clique no botão para instalar as dependências do backend.
2.  Mais abaixo, na seção **Environment Variables**, adicione as seguintes variáveis:
    -   `NODE_ENV`: `production`
    -   `DATABASE_URL`: `SUA_STRING_DE_CONEXAO_COM_MONGODB_ATLAS`
    -   `JWT_SECRET`: `UMA_CHAVE_SECRETA_MUITO_LONGA_E_SEGURA_COM_MAIS_DE_32_CARACTERES`
    -   `CORS_ORIGIN`: `https://maiflix.sublimepapelaria.com.br`
    -   `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` (se for usar o envio de emails)
3.  Clique em **Save**.

### Passo 5: Iniciar e Verificar
1.  No topo da página, clique em **START APP**.
2.  Acesse `https://maiflix.sublimepapelaria.com.br`. A página de login deve carregar.
3.  Acesse `https://maiflix.sublimepapelaria.com.br/api`. Você deve ver a mensagem: `API Maiflix está no ar!`.

---

## 2. Pós-Deploy e Testes

### Ativar SSL
-   No cPanel, vá para **Segurança -> SSL/TLS Status**.
-   Verifique se o seu subdomínio está com o cadeado verde. Se não estiver, selecione-o e clique em **Run AutoSSL**.

### Testar Webhook da Kiwify
1.  Na sua conta da Kiwify, vá para a seção de webhooks.
2.  Adicione um novo endpoint com a URL: `https://maiflix.sublimepapelaria.com.br/api/webhooks/kiwify`.
3.  Use a ferramenta de teste da Kiwify para enviar um evento de `order.paid`.
4.  Verifique os logs da sua aplicação Node.js no cPanel para confirmar o recebimento e o processamento.

### Futuras Atualizações
1.  Pare a aplicação Node.js no cPanel.
2.  Na sua máquina, faça as alterações necessárias no código.
3.  Se alterar o frontend, rode `npm run build` na pasta `frontend` novamente.
4.  Compacte as pastas `backend` e `frontend` atualizadas e envie para o servidor, substituindo os arquivos antigos.
5.  Se houver novas dependências no backend, rode o "NPM Install" novamente.
6.  Inicie a aplicação Node.js.
