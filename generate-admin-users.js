/**
 * Script auxiliar para gerar o JSON do ADMIN_USERS
 * Execute: node generate-admin-users.js
 *
 * Edite o array abaixo com os e-mails, senhas e roles reais.
 * A saída pode ser colocada no .env (ADMIN_USERS=...) ou nas variáveis do Cloud Run.
 * NUNCA commite este arquivo com senhas reais.
 */

const adminUsers = [
    { email: 'admin1@exemplo.com', password: 'SuaSenhaSegura1', role: 'regente' },
    { email: 'admin2@exemplo.com', password: 'SuaSenhaSegura2', role: 'admin' },
    { email: 'financeiro@exemplo.com', password: 'SuaSenhaSegura3', role: 'admin-financeiro' },
];

const jsonString = JSON.stringify(adminUsers);
console.log('\nCopie a linha abaixo para o .env ou Cloud Run:\n');
console.log('ADMIN_USERS=' + jsonString);
console.log('');
