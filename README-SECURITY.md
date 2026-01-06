# 🔒 Configuração de Segurança - Variáveis de Ambiente

## ⚠️ IMPORTANTE: Proteção de Senhas

As senhas dos usuários administradores **NÃO devem** estar expostas no código. Este projeto usa variáveis de ambiente para proteger informações sensíveis.

## 📋 Como Configurar

### 1. Instalar dependências

```bash
cd backend/send-email
npm install
```

### 2. Gerar JSON do ADMIN_USERS

Execute o script auxiliar para gerar o JSON:

```bash
node generate-admin-users.js
```

Copie a saída (a linha que começa com `ADMIN_USERS=...`)

### 3. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto (mesmo nível do `index.js`) com o seguinte formato:

```env
# Configurações de Email
GMAIL_USER=seu-email@gmail.com
GMAIL_PASS=sua-senha-do-gmail

# JWT Secret
JWT_SECRET=sua-chave-secreta-jwt-muito-forte

# Usuários Administradores (JSON - cole a saída do script generate-admin-users.js)
ADMIN_USERS=[{"email":"regente@racionaljazzband.com","password":"SenhaSuperSecreta123","role":"regente"},{"email":"naleribeiro@hotmail.com","password":"naleribeiroRJB","role":"admin"},{"email":"samara.oliver3012@gmail.com","password":"financeiroRJB@1935","role":"admin-financeiro"},{"email":"adersontm@hotmail.com","password":"R8mQ4ZpA","role":"admin"},{"email":"teste@hotmail.com","password":"123456Joel","role":"admin"},{"email":"clarinetabest@hotmail.com","password":"u7#K9pZ$","role":"admin"},{"email":"anapaulacmarciano@gmail.com","password":"a8@J7uC$","role":"admin"},{"email":"edilashirley@gmail.com","password":"b5!T3gC$","role":"admin"},{"email":"vivian.colombo@hotmail.com","password":"V3%u1An$","role":"admin"},{"email":"andressamqxs@gmail.com","password":"A4@d3r$An","role":"admin"}]
```

### 4. Configurar no Google Cloud Run (Produção)

Se você estiver usando Google Cloud Run, configure as variáveis de ambiente:

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com)
2. Vá para **Cloud Run** → Seu serviço → **Editar e Implantar Nova Revisão**
3. Na aba **"Variáveis e Segredos"**, adicione:
   - `GMAIL_USER` = seu email do Gmail
   - `GMAIL_PASS` = sua senha do Gmail
   - `JWT_SECRET` = uma chave secreta forte (ex: `chave-secreta-muito-forte-da-rjb-987654321`)
   - `ADMIN_USERS` = cole o JSON gerado pelo script (sem o prefixo `ADMIN_USERS=`)

### 5. Formato do ADMIN_USERS

O `ADMIN_USERS` deve ser uma string JSON válida com o seguinte formato:

```json
[
  {
    "email": "email@exemplo.com",
    "password": "senha123",
    "role": "admin"
  },
  {
    "email": "outro@exemplo.com",
    "password": "outrasenha",
    "role": "admin-financeiro"
  }
]
```

**Importante**: 
- A string JSON deve estar em uma única linha
- No Cloud Run, cole apenas o JSON (sem `ADMIN_USERS=`)
- No arquivo `.env`, use `ADMIN_USERS=[...]`

## 🚨 Segurança

- ✅ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo `.env` está no `.gitignore`
- ✅ O script `generate-admin-users.js` também está no `.gitignore`
- ✅ Em produção, use variáveis de ambiente do Cloud Run
- ✅ Mantenha as senhas seguras e não compartilhe
- ✅ Se `ADMIN_USERS` não estiver configurado, o sistema **NÃO iniciará** (proteção de segurança)

## 📝 Notas

- O código **NÃO tem fallback** - se `ADMIN_USERS` não estiver definido, o servidor não inicia
- Isso garante que as senhas nunca sejam expostas no código
- Sempre configure as variáveis de ambiente antes de fazer deploy
