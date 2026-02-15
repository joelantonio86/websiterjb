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
