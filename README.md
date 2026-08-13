# Racional Jazz Band — Site Oficial

Site institucional da **Racional Jazz Band** (RJB): música, arte e cultura racional.  
Frontend em React (Vite) e backend Node.js (Express) com Firebase e deploy no Google Cloud Run.

---

## Estrutura do projeto

```
websiterjb/
├── frontend/          # App React (Vite + Tailwind)
│   ├── src/
│   │   ├── pages/     # Home, Sobre, Apresentações, Cadastro, Relatórios, etc.
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
├── backend/
│   └── send-email/    # API Node (Express): e-mail, Firebase, rotas públicas
├── cloudbuild.yaml   # Build e deploy do backend no Cloud Run
└── README.md
```

---

## Tecnologias

| Camada    | Stack |
|-----------|--------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, Axios |
| Backend   | Node.js, Express, Firebase (Firestore), Nodemailer |
| Deploy    | Google Cloud Run (API), hospedagem estática (frontend) |

---

## Rodar em desenvolvimento

### Backend

```bash
cd backend/send-email
npm install
cp .env.example .env   # editar .env com GMAIL_USER, GMAIL_PASS, JWT_SECRET, ADMIN_USERS, etc.
node index.js
```

A API sobe em `http://localhost:8080` (ou a porta em `PORT`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # opcional: VITE_API_BASE apontando para o backend local ou produção
npm run dev
```

O app abre em `http://localhost:5173` (Vite).

---

## Configuração e segurança

- **Variáveis de ambiente:** senhas, JWT e usuários admin ficam em `.env` (nunca versionado). Use `.env.example` como modelo.
- **Backend:** `GMAIL_USER`, `GMAIL_PASS`, `JWT_SECRET`, `ADMIN_USERS` (JSON). Firebase é inicializado via credenciais/ambiente do projeto.
- **Frontend:** `VITE_API_BASE` (URL da API em produção; padrão já aponta para o Cloud Run).

---

## Build e deploy

- **Backend (Cloud Run):** usar o **Cloud Build** com o `cloudbuild.yaml` na raiz (fonte: repositório, branch `main`). O arquivo define build da imagem Docker a partir de `backend/send-email` e deploy no serviço Cloud Run.
- **Frontend:** `cd frontend && npm ci && npm run build`. Publicar o conteúdo de `frontend/dist` no serviço de hospedagem estática (HostGator, Vercel, GitHub Pages, etc.). O workflow em `.github/workflows/deploy-hostgator.yml` pode automatizar o deploy via FTP quando configurados os secrets no repositório.

### Checklist de produção (partituras + repertórios)

Ordem recomendada: **1) variáveis no Cloud Run → 2) merge em `main` / build backend → 3) deploy frontend → 4) smoke test**.

1. **Cloud Run** (`rjb-email-sender`, `europe-west1`) — adicionar (sem remover o GCS existente):
   - `R2_ACCOUNT_ID`
   - `R2_BUCKET_NAME=rjb-sheets`
   - `R2_PUBLIC_BASE_URL=https://pub-934c96bc6fb449a7ad7b3491065976d3.r2.dev`
   - `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` (token Object Read & Write)
   - `STORAGE_PROVIDER=r2` (opcional; R2 activa-se se `R2_*` estiver completo)
   - Confirmar `JWT_SECRET`, `ADMIN_USERS`, `GCS_BUCKET_NAME` já correctos
2. **Merge** da branch de feature em `main` e disparar Cloud Build (`cloudbuild.yaml`).
3. **Frontend:** push em `main` dispara GitHub Pages / HostGator; `VITE_API_BASE` deve apontar para o Cloud Run.
4. **Pós-deploy:**
   - `GET /api/public/health`
   - `GET /api/public/partituras` e `GET /api/public/repertorios`
   - Login admin → `/admin/partituras` (upload PDF/SIB no R2)
   - `/admin/repertorios` (criar Setembro/2026; arquivar antigos se existirem)
   - Se a coleção Firestore `partituras` estiver vazia: **Importar catálogo** (só metadados; não reenvia ficheiros)

**Nota:** GCS continua para mídia/anexos; R2 só para partituras. Não é preciso índice Firestore novo.

---

## Funcionalidades

- Páginas públicas: Home, Sobre, Apresentações, Bastidores, Repertório, Partituras, Agenda, Contato
- Mapa de componentes por estado e mapa de palco (organograma)
- Cadastro de membros com validação
- Autenticação JWT e área administrativa (relatórios, CSV)
- Área financeira (restrita)
- Tema claro/escuro

---

## Licença e contato

Projeto da Racional Jazz Band. Para uso e divulgação do conhecimento racional.
