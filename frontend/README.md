# RJB Frontend - React

Frontend da Racional Jazz Band migrado para React.

## 🚀 Instalação

```bash
cd frontend
npm install
```

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure a URL da API no arquivo `.env` (se necessário):
```
VITE_API_BASE=https://rjb-email-sender-215755766100.europe-west1.run.app
```

## 💻 Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento será iniciado em `http://localhost:3000`

## 📦 Build

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist`.

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── pages/          # Páginas da aplicação
│   │   ├── Home.jsx
│   │   ├── Apresentacoes.jsx
│   │   ├── Bastidores.jsx
│   │   ├── Repertorio.jsx
│   │   ├── Partituras.jsx
│   │   ├── MemberRegistration.jsx
│   │   ├── Reports.jsx
│   │   └── Financeiro.jsx
│   ├── components/     # Componentes reutilizáveis
│   │   ├── Layout/
│   │   ├── VideoCard.jsx
│   │   ├── PageWrapper.jsx
│   │   └── ...
│   ├── contexts/        # Contextos React (Auth, Theme)
│   ├── services/       # Serviços de API
│   └── data/           # Dados estáticos (vídeos, músicas)
├── public/             # Arquivos estáticos
└── package.json
```

## 🔑 Funcionalidades Migradas

- ✅ Páginas públicas (Home, Sobre, Apresentações, Bastidores, Repertório, Partituras, Fotos, Agenda, Contato)
- ✅ Cadastro de membros com validação
- ✅ Sistema de autenticação
- ✅ Área administrativa (relatórios básicos)
- ✅ Dark mode
- ✅ Navegação com React Router
- ⏳ Área financeira (estrutura básica criada, funcionalidades completas em desenvolvimento)

## 🔧 Tecnologias Utilizadas

- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Axios
- jsPDF (para relatórios PDF)

## 📝 Notas

- O backend permanece inalterado e continua funcionando normalmente
- Todas as rotas de API são mantidas compatíveis com o backend existente
- A autenticação usa JWT tokens armazenados no localStorage
