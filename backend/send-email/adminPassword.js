const crypto = require('crypto');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const DEFAULT_SITE_URL = 'https://www.racionaljazzband.com.br';

const GENERIC_FORGOT_MESSAGE =
    'Se este e-mail estiver cadastrado na área administrativa, enviaremos um link para definir uma nova senha. O link expira em 30 minutos.';

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function findAdminUser(adminUsers, email) {
    const normalized = normalizeEmail(email);
    if (!normalized || !Array.isArray(adminUsers)) return null;
    return adminUsers.find((user) => user && normalizeEmail(user.email) === normalized) || null;
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function createResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPasswordHash(password, stored) {
    const [salt, hash] = String(stored || '').split(':');
    if (!salt || !hash || !/^[a-f0-9]+$/i.test(hash)) return false;
    let computed;
    try {
        computed = crypto.scryptSync(String(password), salt, 64).toString('hex');
    } catch {
        return false;
    }
    const left = Buffer.from(hash, 'hex');
    const right = Buffer.from(computed, 'hex');
    if (left.length === 0 || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function passwordsMatch(candidate, expected) {
    const left = Buffer.from(String(candidate ?? ''), 'utf8');
    const right = Buffer.from(String(expected ?? ''), 'utf8');
    if (left.length !== right.length) {
        crypto.timingSafeEqual(left, left);
        return false;
    }
    return crypto.timingSafeEqual(left, right);
}

function validateNewPassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
        return `A nova senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
    }
    return null;
}

function isResetTokenFormat(token) {
    return /^[a-f0-9]{64}$/i.test(String(token || '').trim());
}

function publicSiteUrl() {
    const raw = String(process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(raw)) return DEFAULT_SITE_URL;
    return raw;
}

function buildResetLink(token) {
    return `${publicSiteUrl()}/admin/redefinir-senha?token=${encodeURIComponent(token)}`;
}

function resetExpiry(now = Date.now()) {
    return now + RESET_TOKEN_TTL_MS;
}

module.exports = {
    RESET_TOKEN_TTL_MS,
    GENERIC_FORGOT_MESSAGE,
    normalizeEmail,
    findAdminUser,
    hashToken,
    createResetToken,
    hashPassword,
    verifyPasswordHash,
    passwordsMatch,
    validateNewPassword,
    isResetTokenFormat,
    publicSiteUrl,
    buildResetLink,
    resetExpiry
};
