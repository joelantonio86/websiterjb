# Deploy do frontend React (após git push)

O site hoje é **React (Vite)** na pasta `frontend/`. Para o site funcionar após um `git push`, você precisa:

1. **Gerar o build** do React (`npm run build` na pasta `frontend/`).
2. **Publicar a pasta `frontend/dist`** em um serviço de hospedagem estática.
3. **Configurar a variável de ambiente** da API no ambiente de produção.

---

## O que o frontend precisa em produção

| Item | Descrição |
|------|-----------|
| **Build** | `cd frontend && npm ci && npm run build` → gera a pasta `frontend/dist`. |
| **API** | O frontend chama o backend em `https://rjb-email-sender-215755766100.europe-west1.run.app`. |
| **Variável** | Em produção, defina `VITE_API_BASE` com essa URL (ou deixe em branco para usar o valor padrão já no código). |

---

## HostGator + GitHub Actions (domínio na HostGator)

Se o **domínio** é da HostGator e você quer que o site React seja **publicado no servidor da HostGator** a cada push, use o workflow **Build e Deploy para HostGator**.

### O que já existe no repositório

- **`.github/workflows/deploy-hostgator.yml`**  
  A cada push em `main`/`master` (quando mudar algo em `frontend/`), o workflow:
  1. Faz o build do React (`npm run build` em `frontend/`).
  2. Envia o conteúdo de `frontend/dist` para o servidor da HostGator via **FTP**.

### O que você precisa configurar

1. **Secrets no GitHub** (nunca commite esses valores no código):
   - Repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

   | Nome do secret   | Exemplo                    | Descrição |
   |------------------|----------------------------|-----------|
   | `FTP_SERVER`     | `ftp.seudominio.com.br`    | Servidor FTP (a HostGator informa no painel ou e-mail de boas-vindas). |
   | `FTP_USERNAME`   | `usuario@seudominio.com.br` | Usuário FTP da conta HostGator. |
   | `FTP_PASSWORD`   | `sua_senha_ftp`           | Senha do usuário FTP. |
   | `FTP_REMOTE_DIR`| `/public_html/`           | (Opcional) Pasta no servidor. Padrão: `/public_html/`. |

2. **Onde achar os dados FTP na HostGator**
   - Painel (cPanel ou similar) → **FTP** ou **Contas FTP**.
   - Ou no e-mail de ativação da hospedagem (servidor FTP, usuário e senha).

3. **Domínio**
   - O domínio que você usa na HostGator já aponta para essa hospedagem. Depois do deploy, o site estará em `https://seudominio.com.br` (ou o domínio que estiver configurado na conta).

4. **SPA (rotas do React)**
   - Para rotas como `/relatorios` ou `/cadastro` funcionarem ao acessar direto ou dar F5, o servidor precisa enviar `index.html` para todas as rotas. Na HostGator (Apache) isso costuma ser feito com um arquivo **`.htaccess`** na pasta pública. O workflow pode enviar esse arquivo junto; veja abaixo.

### .htaccess para SPA (opcional)

Se ao abrir `https://seudominio.com.br/relatorios` der 404, crie na **raiz do projeto** (ao lado de `frontend/`) o arquivo **`frontend/public/.htaccess`** com o conteúdo abaixo. O Vite copia o que está em `frontend/public/` para dentro de `dist/`, então o `.htaccess` será enviado no deploy:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Assim, qualquer rota do React passa a ser atendida pelo `index.html`.

### Resumo HostGator

| Passo | Ação |
|-------|------|
| 1 | Configurar no GitHub os secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (e opcionalmente `FTP_REMOTE_DIR`). |
| 2 | Fazer push em `main`/`master` (alterando algo em `frontend/`) para disparar o workflow. |
| 3 | O site estará no domínio configurado na HostGator (ex.: `https://seudominio.com.br`). |

---

## Opção 1: Vercel (recomendado — deploy automático no push)

1. Acesse [vercel.com](https://vercel.com) e faça login (pode usar conta GitHub).
2. **Add New Project** → importe o repositório do site (GitHub).
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_API_BASE` = `https://rjb-email-sender-215755766100.europe-west1.run.app` (opcional; já é o padrão no código)
4. Deploy. A partir daí, **cada push na branch conectada** gera um novo deploy automaticamente.

---

## Opção 2: Netlify

1. Acesse [netlify.com](https://netlify.com) e conecte o repositório GitHub.
2. Configuração do build:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Em **Site settings → Environment variables**, adicione `VITE_API_BASE` = `https://rjb-email-sender-215755766100.europe-west1.run.app` (se quiser sobrescrever).
4. Cada **git push** na branch configurada dispara o build e a publicação.

---

## Opção 3: Firebase Hosting (mesmo projeto Google Cloud)

1. No projeto (raiz ou `frontend`):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```
   - Escolha o projeto Firebase existente.
   - **Public directory:** `dist` (e faça o build a partir de `frontend`: `cd frontend && npm run build`).
   - **Single-page app:** Yes.

2. Crie `firebase.json` na raiz (ou ajuste se já existir):
   ```json
   {
     "hosting": {
       "public": "frontend/dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [{ "source": "**", "destination": "/index.html" }]
     }
   }
   ```
   O build deve ser feito antes: `cd frontend && npm run build`.

3. Deploy manual:
   ```bash
   cd frontend && npm run build && cd .. && firebase deploy
   ```
   Para automatizar no **git push**, use GitHub Actions (veja seção abaixo).

4. Variável de ambiente: no build, o Vite embutirá `VITE_API_BASE` se você definir antes do build, por exemplo em CI:
   ```bash
   export VITE_API_BASE="https://rjb-email-sender-215755766100.europe-west1.run.app"
   cd frontend && npm run build
   ```

---

## Opção 4: Deploy manual (qualquer hospedagem estática)

Se você sobe os arquivos manualmente (FTP, painel, etc.):

1. Na sua máquina:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
2. Envie **todo o conteúdo** da pasta `frontend/dist` para a raiz do site no servidor (ou para a pasta configurada como “pública”).
3. O servidor deve redirecionar todas as rotas para `index.html` (SPA). No Apache, por exemplo, um `.htaccess` com mod_rewrite para `index.html` resolve.

---

## Resumo: o que fazer para o frontend funcionar após o git push

| Objetivo | Ação |
|----------|------|
| Deploy automático ao dar push | Conecte o repositório na **Vercel** ou **Netlify** (Opções 1 ou 2) e configure build em `frontend` com `npm run build` e saída `dist`. |
| Usar só Google Cloud | Use **Firebase Hosting** (Opção 3) e automatize o build + `firebase deploy` com GitHub Actions (exemplo abaixo). |
| Não expor dados sensíveis | A API pública do mapa só retorna totais agregados; dados de usuário continuam protegidos no backend. |

---

## Exemplo de GitHub Action (build do frontend)

O workflow em `.github/workflows/frontend-build.yml` (criado no repositório) roda o build do frontend a cada push. Isso **não faz deploy sozinho**, mas:

- Garante que o projeto continua buildando após mudanças.
- Você pode evoluir o workflow para publicar na Vercel, Netlify ou Firebase (com os tokens nos secrets do GitHub).

Depois de conectar o repo na Vercel ou Netlify, o “deploy após git push” fica a cargo deles; o Action fica como garantia extra de que o build não quebrou.
