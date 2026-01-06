/**
 * Script auxiliar para gerar o JSON do ADMIN_USERS
 * Execute: node generate-admin-users.js
 * 
 * Este script ajuda a gerar a string JSON para a variável ADMIN_USERS
 * Copie a saída e cole no arquivo .env ou nas variáveis de ambiente do Cloud Run
 */

const adminUsers = [
    { email: 'regente@racionaljazzband.com', password: 'SenhaSuperSecreta123', role: 'regente' },
    { email: 'naleribeiro@hotmail.com', password: 'naleribeiroRJB', role: 'admin' },
    { email: 'samara.oliver3012@gmail.com', password: 'financeiroRJB@1935', role: 'admin-financeiro' },
    { email: 'adersontm@hotmail.com', password: 'R8mQ4ZpA', role: 'admin' },
    { email: 'teste@hotmail.com', password: '123456Joel', role: 'admin' },
    { email: 'clarinetabest@hotmail.com', password: 'u7#K9pZ$', role: 'admin' },
    { email: 'anapaulacmarciano@gmail.com', password: 'a8@J7uC$', role: 'admin' },
    { email: 'edilashirley@gmail.com', password: 'b5!T3gC$', role: 'admin' },
    { email: 'vivian.colombo@hotmail.com', password: 'V3%u1An$', role: 'admin' },
    { email: 'andressamqxs@gmail.com', password: 'A4@d3r$An', role: 'admin' },
];

// Gera o JSON em uma única linha (formato para .env)
const jsonString = JSON.stringify(adminUsers);

console.log('\n📋 Copie a linha abaixo e cole no seu arquivo .env:\n');
console.log('ADMIN_USERS=' + jsonString);
console.log('\n✅ Pronto! Agora suas senhas estão protegidas.\n');
