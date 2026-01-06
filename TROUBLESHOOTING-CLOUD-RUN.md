# 🔧 Troubleshooting - Erro no Cloud Run

## ❌ Problema Identificado

O container está falhando ao iniciar com o erro:
- `Container called exit(1)`
- `Default STARTUP TCP probe failed` na porta 8080

## 🔍 Causa Raiz

O código está lançando um erro **antes do servidor iniciar** quando:
1. `ADMIN_USERS` não está configurado
2. `ADMIN_USERS` está mal formatado (JSON inválido)
3. `ADMIN_USERS` está truncado (valor incompleto)

## ✅ Correções Aplicadas

1. **Validação melhorada do JSON**: Agora o código verifica se o JSON está completo e válido
2. **Mensagens de erro mais detalhadas**: Logs mostram exatamente qual é o problema
3. **Validação de estrutura**: Verifica se cada usuário tem `email`, `password` e `role`
4. **Logs informativos**: Mostra quantos usuários foram carregados com sucesso

## 🔧 Como Corrigir no Cloud Run

### Passo 1: Verificar o valor de `ADMIN_USERS`

No console do Cloud Run, verifique se o valor de `ADMIN_USERS` está **completo** e **válido**.

**Formato correto:**
```json
[{"email":"regente@racionaljazzband.com","password":"SenhaSuperSecreta123","role":"regente"},{"email":"naleribeiro@hotmail.com","password":"naleribeiroRJB","role":"admin"},{"email":"samara.oliver3012@gmail.com","password":"financeiroRJB@1935","role":"admin-financeiro"},{"email":"adersontm@hotmail.com","password":"R8mQ4ZpA","role":"admin"},{"email":"teste@hotmail.com","password":"123456Joel","role":"admin"},{"email":"clarinetabest@hotmail.com","password":"u7#K9pZ$","role":"admin"},{"email":"anapaulacmarciano@gmail.com","password":"a8@J7uC$","role":"admin"},{"email":"edilashirley@gmail.com","password":"b5!T3gC$","role":"admin"},{"email":"vivian.colombo@hotmail.com","password":"V3%u1An$","role":"admin"},{"email":"andressamqxs@gmail.com","password":"A4@d3r$An","role":"admin"}]
```

### Passo 2: Gerar o JSON correto

Execute localmente:
```bash
node generate-admin-users.js
```

Copie a saída completa (a linha que começa com `ADMIN_USERS=...`)

### Passo 3: Atualizar no Cloud Run

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com)
2. Vá para **Cloud Run** → `rjb-email-sender` → **Editar e Implantar Nova Revisão**
3. Na aba **"Variáveis e Segredos"**, localize `ADMIN_USERS`
4. **Cole o JSON completo** (sem o prefixo `ADMIN_USERS=`)
5. **IMPORTANTE**: Certifique-se de que o valor não está truncado
6. Clique em **"Implantar"**

### Passo 4: Verificar os logs

Após o deploy, verifique os logs do Cloud Run. Você deve ver:
```
✅ ADMIN_USERS carregado com sucesso: 10 usuário(s) configurado(s).
✅ Firebase Admin inicializado com sucesso.
✅ Google Cloud Storage inicializado. Bucket: rjb-admin-files-bucket
RJB Backend Produção na porta 8080
```

Se houver erros, os logs mostrarão exatamente qual é o problema.

## 🚨 Problemas Comuns

### 1. JSON Truncado
**Sintoma**: Valor aparece como `[{"email":"regente@racionaljazzband.com","passw...`
**Solução**: O campo no Cloud Run tem limite de caracteres. Certifique-se de colar o JSON completo.

### 2. Caracteres Especiais
**Sintoma**: Erro de parse do JSON
**Solução**: Caracteres como `@`, `$`, `#`, `%` devem estar dentro de aspas duplas no JSON.

### 3. Vírgulas Faltando
**Sintoma**: Erro de parse do JSON
**Solução**: Verifique se há vírgula entre cada objeto do array (exceto o último).

### 4. Aspas Simples vs Duplas
**Sintoma**: Erro de parse do JSON
**Solução**: JSON requer aspas **duplas** (`"`), não simples (`'`).

## 📋 Checklist de Verificação

Antes de fazer deploy, verifique:

- [ ] `GMAIL_USER` está configurado
- [ ] `GMAIL_PASS` está configurado
- [ ] `JWT_SECRET` está configurado
- [ ] `GCS_BUCKET_NAME` está configurado (ou usando o padrão)
- [ ] `ADMIN_USERS` está configurado e **completo**
- [ ] `ADMIN_USERS` é um JSON válido (pode testar em https://jsonlint.com)
- [ ] Todos os usuários têm `email`, `password` e `role`
- [ ] Não há caracteres especiais escapados incorretamente

## 🔍 Como Testar o JSON Localmente

Crie um arquivo `test-admin-users.js`:
```javascript
const adminUsers = '[{"email":"regente@racionaljazzband.com","password":"SenhaSuperSecreta123","role":"regente"}]';

try {
    const parsed = JSON.parse(adminUsers);
    console.log('✅ JSON válido!');
    console.log('Usuários:', parsed.length);
} catch (error) {
    console.error('❌ JSON inválido:', error.message);
}
```

Execute: `node test-admin-users.js`

## 📞 Próximos Passos

1. Atualize o `ADMIN_USERS` no Cloud Run com o JSON completo
2. Faça o deploy
3. Verifique os logs
4. Se ainda houver erro, os logs mostrarão exatamente qual é o problema
