const test = require('node:test');
const assert = require('node:assert/strict');
const {
    findAdminUser,
    hashToken,
    hashPassword,
    verifyPasswordHash,
    passwordsMatch,
    validateNewPassword,
    isResetTokenFormat,
    buildResetLink,
    GENERIC_FORGOT_MESSAGE
} = require('./adminPassword');

test('encontra o administrador ignorando maiúsculas no e-mail', () => {
    const users = [{ email: 'Admin@Exemplo.com', password: 'segredo', role: 'admin' }];
    assert.equal(findAdminUser(users, ' admin@exemplo.com ')?.role, 'admin');
    assert.equal(findAdminUser(users, 'outro@exemplo.com'), null);
});

test('a senha nova confere com o hash e a antiga deixa de valer', () => {
    const stored = hashPassword('senha-nova-123');
    assert.equal(verifyPasswordHash('senha-nova-123', stored), true);
    assert.equal(verifyPasswordHash('senha-antiga', stored), false);
    assert.equal(stored.includes('senha-nova-123'), false);
});

test('a comparação da senha atual não aceita valor diferente', () => {
    assert.equal(passwordsMatch('abc', 'abc'), true);
    assert.equal(passwordsMatch('abc', 'abcd'), false);
});

test('o token de redefinição não carrega a senha', () => {
    const token = 'a'.repeat(64);
    assert.equal(isResetTokenFormat(token), true);
    assert.equal(isResetTokenFormat('curto'), false);
    assert.equal(hashToken(token), hashToken(token));
    assert.notEqual(hashToken(token), token);
    const link = buildResetLink(token);
    assert.match(link, /\/admin\/redefinir-senha\?token=/);
    assert.equal(link.includes('senha'), true);
    assert.equal(GENERIC_FORGOT_MESSAGE.toLowerCase().includes('senha atual'), false);
});

test('rejeita senha curta demais', () => {
    assert.match(validateNewPassword('1234567'), /8/);
    assert.equal(validateNewPassword('12345678'), null);
});
