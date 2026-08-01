// Primeira linha: confirma que este arquivo está rodando no container (visível nos logs do Cloud Run)
console.log('RJB index.js iniciado');
// Carregar variáveis de ambiente
require('dotenv').config();
console.log('Backend RJB: carregando...');

const nodemailer = require('nodemailer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const storageAdapter = require('./storageAdapter');

// --- 1. Constantes e Ambiente (Preservadas do Original) ---
const SENDER_EMAIL = process.env.GMAIL_USER;
const SENDER_PASS = process.env.GMAIL_PASS;
const TARGET_EMAIL = 'contato.racionaljazzband@gmail.com, racionaljazzbandoficial@gmail.com, andressamqxs@gmail.com';
const VALID_INVITE_KEYS = ['RJB-MEMBER-2025', 'RJB-TESTE-999'];
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-muito-forte-da-rjb-987654321';

if (!SENDER_EMAIL || !SENDER_PASS) {
    console.warn('⚠️  AVISO: GMAIL_USER ou GMAIL_PASS não configurados. Funcionalidades de e-mail podem não funcionar.');
}
if (!JWT_SECRET || JWT_SECRET === 'chave-secreta-muito-forte-da-rjb-987654321') {
    console.warn('⚠️  AVISO: JWT_SECRET usando valor padrão. Configure uma chave secreta forte em produção.');
}

let ADMIN_USERS = [];
try {
    if (process.env.ADMIN_USERS) {
        const adminUsersStr = process.env.ADMIN_USERS.trim();
        if (!adminUsersStr || adminUsersStr.length < 10) {
            console.warn('⚠️ ADMIN_USERS vazio ou truncado. Login de admin ficará indisponível.');
        } else {
            ADMIN_USERS = JSON.parse(adminUsersStr);
            if (!Array.isArray(ADMIN_USERS) || ADMIN_USERS.length === 0) {
                console.warn('⚠️ ADMIN_USERS inválido ou vazio.');
                ADMIN_USERS = [];
            } else {
                const ok = ADMIN_USERS.every(u => u && u.email && u.password && u.role);
                if (!ok) {
                    console.warn('⚠️ ADMIN_USERS com usuário incompleto.');
                    ADMIN_USERS = [];
                } else {
                    console.log(`✅ ADMIN_USERS carregado: ${ADMIN_USERS.length} usuário(s).`);
                }
            }
        }
    } else {
        console.warn('⚠️ ADMIN_USERS não definido. Login de admin ficará indisponível.');
    }
} catch (e) {
    console.warn('⚠️ Erro ao carregar ADMIN_USERS:', e.message, '- Login de admin indisponível.');
    ADMIN_USERS = [];
}

const app = express();
const PORT = process.env.PORT || 8080;

// --- 2. Middlewares e Configurações Iniciais ---
app.set('trust proxy', 1);
app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.options('*', cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 429, message: "Muitas requisições. Tente novamente após 15 minutos." }
});

// --- 3. Serviços (Firebase/GCS) — inicializados depois do listen para o Cloud Run passar no health check ---
let db, membersCollection, keysCollection, contributionsCollection, depositsCollection, expensesCollection, youtubeVideosCollection, repertoriosCollection, partiturasCollection, bucket, BUCKET_NAME;

function initFirebaseAndGCS() {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({});
            console.log('✅ Firebase Admin inicializado com sucesso.');
        }
        db = admin.firestore();
        membersCollection = db.collection('members');
        keysCollection = db.collection('inviteKeys');
        contributionsCollection = db.collection('contributions');
        depositsCollection = db.collection('deposits');
        expensesCollection = db.collection('expenses');
        youtubeVideosCollection = db.collection('youtubeVideos');
        repertoriosCollection = db.collection('repertorios');
        partiturasCollection = db.collection('partituras');
        const storage = new Storage();
        BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'rjb-admin-files-bucket';
        bucket = storage.bucket(BUCKET_NAME);
        console.log(`✅ Google Cloud Storage inicializado. Bucket: ${BUCKET_NAME}`);

        const wantR2 = String(process.env.STORAGE_PROVIDER || '').toLowerCase() === 'r2';
        const r2Ok = wantR2 && storageAdapter.initR2FromEnv();
        if (!r2Ok) {
            storageAdapter.initGCS({ bucket, bucketName: BUCKET_NAME });
            if (wantR2) {
                console.warn('⚠️ STORAGE_PROVIDER=r2 mas credenciais R2 incompletas; usando Google Cloud Storage para ficheiros.');
            }
            console.log('📦 Armazenamento de ficheiros: Google Cloud Storage');
        } else {
            console.log('📦 Armazenamento de ficheiros: Cloudflare R2');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar serviços (Firebase/GCS):', error);
        console.error('📋 Detalhes do erro:', error.message);
    }
}

// Middleware: rotas que precisam do Firestore retornam 503 até os serviços estarem prontos
const publicPathsNoFirebase = ['/api/public/health', '/api/public/partituras/proxy'];
app.use((req, res, next) => {
    if (!membersCollection && !publicPathsNoFirebase.includes(req.path)) {
        return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente em alguns segundos.' });
    }
    next();
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

// --- 4. Middlewares de Segurança ---
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ status: 403, message: 'Sessão expirada.' });
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json({ status: 401, message: 'Autenticação necessária.' });
    }
}

// --- 5. Rotas Administrativas e de Convite ---

app.post('/api/admin/generate-key', authenticateJWT, async (req, res) => {
    const { inviteKey } = req.body;
    if (!inviteKey || !/^RJB-AUTO-[A-Z0-9]{6}$/.test(inviteKey)) {
        return res.status(400).json({ message: 'Formato de chave inválido.' });
    }
    try {
        await keysCollection.doc(inviteKey.toUpperCase()).set({
            used: false,
            generatedBy: req.user.userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: 'Chave sincronizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar chave.' });
    }
});

app.post('/api/admin/login', limiter, (req, res) => {
    const { email, password } = req.body;
    const user = ADMIN_USERS.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ status: 401, message: 'E-mail ou senha incorretos.' });

    const token = jwt.sign({ userId: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ status: 200, message: 'Login OK', token, role: user.role });
});

// --- 6. Rotas de Membros e Cadastro ---

app.post('/api/register-member', limiter, async (req, res) => {
    const { inviteKey, name, instrument, email, phone, city, state, tefa, termsVersion, termsAccepted } = req.body;
    const keyUpper = inviteKey?.toUpperCase();

    try {
        if (!name || !instrument || !email || !city || !state || !phone) {
            return res.status(400).json({ status: 400, message: 'Todos os campos são obrigatórios.' });
        }

        let isMasterKey = VALID_INVITE_KEYS.includes(keyUpper);
        let keyDocRef = keysCollection.doc(keyUpper);

        if (!isMasterKey) {
            const keySnap = await keyDocRef.get();
            if (!keySnap.exists || keySnap.data().used === true) {
                return res.status(401).json({ status: 401, message: 'Chave inválida ou já utilizada.' });
            }
        }

        if (termsAccepted !== true) return res.status(400).json({ message: 'Aceite os termos LGPD.' });

        await membersCollection.add({
            name, instrument, email, city, state, phone, tefa: tefa || "", termsVersion, termsAccepted,
            registrationIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!isMasterKey) {
            await keyDocRef.update({ used: true, usedBy: email, usedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: SENDER_EMAIL, pass: SENDER_PASS }
        });

        const memberMailOptions = {
            from: `"Racional Jazz Band" <${SENDER_EMAIL}>`,
            to: email,
            subject: 'Confirmação de Inscrição - RJB',
            text: `Olá ${name}!\n\nSua inscrição na Racional Jazz Band foi concluída com sucesso.\n\nInstrumento: ${instrument}\nCidade: ${city}/${state}\n\nEm breve entraremos em contato para mais informações. Seja bem-vindo(a)!`
        };

        const adminMailOptions = {
            from: `"Sistema RJB" <${SENDER_EMAIL}>`,
            to: TARGET_EMAIL,
            subject: `Novo Cadastro: ${name}`,
            text: `Um novo membro se cadastrou!\n\nNome: ${name}\nInstrumento: ${instrument}\nE-mail: ${email}\nTelefone: ${phone}\nLocal: ${city}/${state}\nChave utilizada: ${inviteKey}`
        };

        await Promise.all([
            transporter.sendMail(memberMailOptions),
            transporter.sendMail(adminMailOptions)
        ]);

        res.status(200).json({ status: 200, message: `Inscrição de ${name} concluída com sucesso!` });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ status: 500, message: 'Erro ao processar cadastro ou enviar e-mail.' });
    }
});

// --- Rotas públicas (sem autenticação) ---
app.get('/api/public/health', (req, res) => {
    res.json({ ok: true, version: 'with-members-by-state', service: 'rjb-email-sender' });
});

const R2_BASE = 'https://pub-934c96bc6fb449a7ad7b3491065976d3.r2.dev';
app.get('/api/public/partituras/proxy', async (req, res) => {
    const { folder, file } = req.query;
    if (!folder || !file) {
        return res.status(400).json({ message: 'Parâmetros folder e file são obrigatórios.' });
    }
    if (!['racionais', 'diversas'].includes(folder)) {
        return res.status(400).json({ message: 'Pasta inválida.' });
    }
    const safeFile = String(file).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeFile || safeFile !== file) {
        return res.status(400).json({ message: 'Nome de arquivo inválido.' });
    }
    const url = `${R2_BASE}/${folder}/pdf/${safeFile}.pdf`;
    try {
        const r = await fetch(url);
        if (!r.ok) {
            return res.status(r.status).json({ message: 'PDF não encontrado.' });
        }
        const buffer = await r.arrayBuffer();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeFile}.pdf"`);
        res.send(Buffer.from(buffer));
    } catch (e) {
        console.error('Erro ao buscar PDF:', e.message);
        res.status(502).json({ message: 'Erro ao buscar o arquivo.' });
    }
});

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
app.get('/api/public/stats/members-by-state', async (req, res) => {
    try {
        const snapshot = await membersCollection.get();
        const byState = {};
        const byStateDetail = {};
        UFS.forEach(uf => {
            byState[uf] = 0;
            byStateDetail[uf] = { count: 0, cities: {}, instruments: {} };
        });
        snapshot.forEach(doc => {
            const d = doc.data();
            const state = (d.state || '').toUpperCase().trim();
            if (!state || byState[state] === undefined) return;
            byState[state]++;
            const city = (d.city || '').trim() || '(não informada)';
            const instrument = (d.instrument || '').trim() || '(não informado)';
            byStateDetail[state].count = byState[state];
            byStateDetail[state].cities[city] = (byStateDetail[state].cities[city] || 0) + 1;
            byStateDetail[state].instruments[instrument] = (byStateDetail[state].instruments[instrument] || 0) + 1;
        });
        res.status(200).json({ byState, byStateDetail, total: snapshot.size });
    } catch (error) {
        console.error('Erro ao buscar membros por estado:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
    }
});

app.get('/api/public/stats/stage-roster', async (req, res) => {
    try {
        const snapshot = await membersCollection.get();
        const members = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            let state = (d.state || '').trim().toUpperCase();
            if (state.length > 2) state = state.slice(0, 2);
            if (!state || !UFS.includes(state)) state = '—';
            const name = (d.name || '').trim();
            if (!name) return;
            const instrument = (d.instrument || '').trim() || '(não informado)';
            members.push({ name, state, instrument });
        });
        const firstNames = {};
        members.forEach(m => {
            const parts = m.name.split(/\s+/).filter(Boolean);
            const first = (parts[0] || '').toLowerCase();
            firstNames[first] = (firstNames[first] || 0) + 1;
        });
        const roster = members.map(m => {
            const parts = m.name.split(/\s+/).filter(Boolean);
            const firstName = parts[0] || '';
            const duplicate = firstNames[(firstName || '').toLowerCase()] > 1;
            const displayName = duplicate && parts.length >= 2
                ? `${parts[0]} ${parts[1]}`
                : firstName;
            return { displayName, state: m.state, instrument: m.instrument };
        });
        roster.sort((a, b) => {
            if (a.state !== b.state) return a.state.localeCompare(b.state);
            return (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR');
        });
        res.status(200).json({ roster });
    } catch (error) {
        console.error('Erro ao buscar mapa de palco:', error);
        res.status(500).json({ message: 'Erro ao buscar mapa de palco.' });
    }
});

// --- 7. Rotas de Relatórios ---

app.get('/api/reports/members', authenticateJWT, async (req, res) => {
    try {
        const snapshot = await membersCollection.get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        res.status(200).json({ totalMembers: data.length, allMembers: data });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar relatórios.' });
    }
});

app.get('/api/reports/members/csv', authenticateJWT, async (req, res) => {
    try {
        const snapshot = await membersCollection.get();
        let csv = 'ID,Nome,TEFA,Instrumento,Email,Contato,Cidade,Estado,Data\n';

        snapshot.forEach(doc => {
            const d = doc.data();
            const date = d.submittedAt ? d.submittedAt.toDate().toISOString() : "";
            csv += `${doc.id},"${d.name}","${d.tefa || ""}","${d.instrument}","${d.email}","${d.phone || ""}","${d.city}","${d.state}",${date}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_rjb.csv"');
        res.status(200).send(csv);
    } catch (error) {
        console.error('Erro ao gerar CSV:', error);
        res.status(500).send('Erro ao gerar CSV.');
    }
});

// --- 8. Rotas de Anexos GCS ---

function normalizeAttachmentNameParam(name) {
    if (!name || typeof name !== 'string') return '';
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

function safeAttachmentName(name) {
    const n = normalizeAttachmentNameParam(name);
    if (!n || n.includes('/') || n.includes('\\') || n.includes('..')) return null;
    return n;
}

function parseAttachmentName(name) {
    const n = normalizeAttachmentNameParam(name);
    const withPeriod = n.match(/^(foto|video)__(\d{4}-\d{2})__(.+)$/i);
    if (withPeriod) {
        return { media: withPeriod[1].toLowerCase(), period: withPeriod[2], rest: withPeriod[3] };
    }
    const legacy = n.match(/^(foto|video)__(.+)$/i);
    if (legacy) {
        return { media: legacy[1].toLowerCase(), period: null, rest: legacy[2] };
    }
    return null;
}

function extractYoutubeId(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
    try {
        const u = new URL(raw);
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '').trim();
            return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
        }
        if (u.hostname.includes('youtube.com')) {
            const v = u.searchParams.get('v');
            if (/^[a-zA-Z0-9_-]{11}$/.test(v || '')) return v;
            const parts = u.pathname.split('/').filter(Boolean);
            const last = parts[parts.length - 1] || '';
            return /^[a-zA-Z0-9_-]{11}$/.test(last) ? last : null;
        }
    } catch {
        return null;
    }
    return null;
}

app.get('/api/attachments/list', authenticateJWT, async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const fileList = await storageAdapter.listFiles();
        res.status(200).json(fileList);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar arquivos.' });
    }
});

app.get('/api/public/photos', async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const files = await storageAdapter.listFiles();
        const photos = files
            .filter((f) => String(f.name || '').toLowerCase().startsWith('foto__'))
            .map((f) => {
                const parsed = parseAttachmentName(f.name);
                return {
                    name: f.name,
                    periodKey: parsed?.period || null,
                    uploaded: f.uploaded || null,
                    url: f.downloadUrl
                };
            });
        res.status(200).json(photos);
    } catch (error) {
        console.error('public/photos:', error);
        res.status(500).json({ message: 'Erro ao listar fotos.' });
    }
});

app.post('/api/attachments/upload', authenticateJWT, upload.array('files', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    const mediaType = 'foto';
    const periodKey = String(req.body.periodKey || '').trim();
    if (!/^\d{4}-\d{2}$/.test(periodKey) || periodKey < '2025-12') {
        return res.status(400).json({ message: 'Selecione um período válido (dezembro de 2025 em diante).' });
    }
    if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });

    const uploaded = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
        const currentFile = req.files[i];
        if (!currentFile.mimetype.startsWith('image/')) {
            errors.push({ originalName: currentFile.originalname, message: 'Apenas imagens são permitidas nesta área.' });
            continue;
        }
        try {
            const safeOriginal = currentFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${mediaType}__${periodKey}__${Date.now()}-${i}-${safeOriginal}`;
            const publicUrl = await storageAdapter.uploadBuffer(fileName, currentFile.buffer, currentFile.mimetype);
            uploaded.push({ originalName: currentFile.originalname, fileName, publicUrl });
        } catch (e) {
            console.error('attachments/upload item:', e);
            errors.push({ originalName: currentFile.originalname, message: 'Erro ao enviar este arquivo.' });
        }
    }

    if (uploaded.length === 0) {
        return res.status(500).json({ message: 'Nenhuma foto pôde ser enviada.', errors });
    }

    res.status(200).json({
        status: 200,
        message: `${uploaded.length} de ${req.files.length} foto(s) enviada(s) com sucesso.`,
        uploaded,
        errors
    });
});

app.patch('/api/attachments/move', authenticateJWT, async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const fileName = safeAttachmentName(req.body?.fileName);
        const periodKey = String(req.body?.periodKey || '').trim();
        if (!fileName) return res.status(400).json({ message: 'Nome de arquivo inválido.' });
        if (!/^\d{4}-\d{2}$/.test(periodKey) || periodKey < '2025-12') {
            return res.status(400).json({ message: 'Período inválido.' });
        }
        const parsed = parseAttachmentName(fileName);
        if (!parsed) return res.status(400).json({ message: 'Arquivo não reconhecido.' });
        const destName = `${parsed.media}__${periodKey}__${parsed.rest}`;
        if (destName === fileName) {
            return res.status(200).json({ status: 200, message: 'Sem alterações.', newName: destName });
        }
        const exists = await storageAdapter.objectExists(fileName);
        if (!exists) return res.status(404).json({ message: 'Arquivo não encontrado.' });
        const destExists = await storageAdapter.objectExists(destName);
        if (destExists) {
            return res.status(409).json({ message: 'Já existe um arquivo no período de destino com o mesmo sufixo. Exclua ou renomeie antes.' });
        }
        await storageAdapter.copyObject(fileName, destName);
        await storageAdapter.deleteObject(fileName);
        res.status(200).json({ status: 200, message: 'Período atualizado.', newName: destName });
    } catch (error) {
        console.error('attachments/move:', error);
        res.status(500).json({ message: 'Erro ao mover arquivo.' });
    }
});

app.post('/api/attachments/replace', authenticateJWT, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente.' });
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const existingFileName = safeAttachmentName(req.body?.existingFileName);
        if (!existingFileName) return res.status(400).json({ message: 'Nome do arquivo inválido.' });
        const parsed = parseAttachmentName(existingFileName);
        if (!parsed) return res.status(400).json({ message: 'Arquivo não reconhecido.' });
        const mediaType = parsed.media;
        let periodKey = parsed.period;
        if (!periodKey) {
            periodKey = String(req.body?.periodKey || '').trim();
        }
        if (!/^\d{4}-\d{2}$/.test(periodKey) || periodKey < '2025-12') {
            return res.status(400).json({
                message: 'Para arquivos antigos sem período, escolha o mês/ano no formulário de substituição.'
            });
        }
        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');
        if ((mediaType === 'foto' && !isImage) || (mediaType === 'video' && !isVideo)) {
            return res.status(400).json({ message: 'O novo arquivo deve ser do mesmo tipo (foto ou vídeo).' });
        }
        const exists = await storageAdapter.objectExists(existingFileName);
        if (!exists) return res.status(404).json({ message: 'Arquivo original não encontrado.' });
        const safeOriginal = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newName = `${mediaType}__${periodKey}__${Date.now()}-${safeOriginal}`;
        const publicUrl = await storageAdapter.uploadBuffer(newName, req.file.buffer, req.file.mimetype);
        try {
            await storageAdapter.deleteObject(existingFileName);
        } catch (delErr) {
            console.error('attachments/replace: falha ao remover arquivo antigo', delErr);
        }
        res.status(200).json({
            status: 200,
            message: 'Arquivo substituído.',
            publicUrl,
            newName
        });
    } catch (error) {
        console.error('attachments/replace:', error);
        res.status(500).json({ message: 'Erro ao substituir arquivo.' });
    }
});

app.delete('/api/attachments/delete/:fileName', authenticateJWT, async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const fileName = safeAttachmentName(req.params.fileName);
        if (!fileName) return res.status(400).json({ message: 'Nome inválido.' });
        await storageAdapter.deleteObject(fileName);
        res.status(200).json({ status: 200, message: 'Arquivo excluído.' });
    } catch (error) {
        res.status(error.code === 404 ? 404 : 500).json({ message: 'Erro ao excluir.' });
    }
});

// --- 8.1 Rotas de videos YouTube (admin) ---

app.get('/api/admin/youtube-videos', authenticateJWT, async (req, res) => {
    try {
        const periodKey = String(req.query.periodKey || '').trim();
        let query = youtubeVideosCollection.orderBy('createdAt', 'desc');
        if (/^\d{4}-\d{2}$/.test(periodKey)) {
            query = youtubeVideosCollection.where('periodKey', '==', periodKey).orderBy('createdAt', 'desc');
        }
        const snapshot = await query.get();
        const data = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            data.push({
                id: doc.id,
                title: d.title || '',
                youtubeId: d.youtubeId || '',
                url: d.url || '',
                periodKey: d.periodKey || '',
                visibility: d.visibility || 'unlisted',
                category: d.category || 'bastidor',
                createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null
            });
        });
        res.status(200).json(data);
    } catch (error) {
        console.error('youtube-videos/list:', error);
        res.status(500).json({ message: 'Erro ao listar videos.' });
    }
});

app.post('/api/admin/youtube-videos', authenticateJWT, async (req, res) => {
    try {
        const title = String(req.body?.title || '').trim();
        const source = String(req.body?.url || req.body?.youtubeId || '').trim();
        const periodKey = String(req.body?.periodKey || '').trim();
        const categoryRaw = String(req.body?.category || 'bastidor').trim().toLowerCase();
        const category = categoryRaw === 'apresentacao' ? 'apresentacao' : 'bastidor';
        const visibility = String(req.body?.visibility || 'unlisted').trim().toLowerCase() === 'public' ? 'public' : 'unlisted';

        if (!title) return res.status(400).json({ message: 'Informe o titulo do video.' });
        if (!/^\d{4}-\d{2}$/.test(periodKey) || periodKey < '2025-12') {
            return res.status(400).json({ message: 'Periodo invalido.' });
        }
        const youtubeId = extractYoutubeId(source);
        if (!youtubeId) return res.status(400).json({ message: 'Link/ID do YouTube invalido.' });

        const url = `https://www.youtube.com/watch?v=${youtubeId}`;
        const docRef = await youtubeVideosCollection.add({
            title,
            youtubeId,
            url,
            periodKey,
            category,
            visibility,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user?.userId || 'admin'
        });

        res.status(200).json({ status: 200, id: docRef.id, message: 'Video cadastrado.' });
    } catch (error) {
        console.error('youtube-videos/create:', error);
        res.status(500).json({ message: 'Erro ao cadastrar video.' });
    }
});

app.delete('/api/admin/youtube-videos/:id', authenticateJWT, async (req, res) => {
    try {
        await youtubeVideosCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Video removido.' });
    } catch (error) {
        console.error('youtube-videos/delete:', error);
        res.status(500).json({ message: 'Erro ao remover video.' });
    }
});

app.get('/api/public/youtube-videos', async (req, res) => {
    try {
        const periodKey = String(req.query.periodKey || '').trim();
        const categoryRaw = String(req.query.category || '').trim().toLowerCase();
        const category = categoryRaw === 'apresentacao' ? 'apresentacao' : (categoryRaw === 'bastidor' ? 'bastidor' : '');

        let query = youtubeVideosCollection.orderBy('createdAt', 'desc');
        if (/^\d{4}-\d{2}$/.test(periodKey)) {
            query = query.where('periodKey', '==', periodKey);
        }
        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        const data = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            data.push({
                id: doc.id,
                title: d.title || '',
                youtubeId: d.youtubeId || '',
                url: d.url || '',
                periodKey: d.periodKey || '',
                category: d.category || 'bastidor',
                visibility: d.visibility || 'unlisted',
                createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null
            });
        });
        res.status(200).json(data);
    } catch (error) {
        console.error('public/youtube-videos:', error);
        res.status(500).json({ message: 'Erro ao listar videos.' });
    }
});

// --- 8.2 Rotas de Repertórios (CRUD admin + leitura pública) ---

function sanitizeRepertorioSongs(rawSongs) {
    if (!Array.isArray(rawSongs)) return [];
    return rawSongs
        .filter(s => s && typeof s === 'object' && String(s.title || '').trim())
        .map(s => ({
            title: String(s.title).trim(),
            folder: String(s.folder || '').trim(),
            mp3: String(s.mp3 || '').trim()
        }))
        .slice(0, 200);
}

function validateRepertorioPayload(body) {
    const name = String(body?.name || '').trim();
    const date = String(body?.date || '').trim();
    const location = String(body?.location || '').trim();
    const songs = sanitizeRepertorioSongs(body?.songs);

    if (!name) return { error: 'Informe o nome do repertório.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Informe uma data de apresentação válida.' };

    return { value: { name, date, location, songs } };
}

function serializeRepertorio(doc) {
    const d = doc.data();
    return {
        id: doc.id,
        name: d.name || '',
        date: d.date || '',
        location: d.location || '',
        songs: Array.isArray(d.songs) ? d.songs : [],
        createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null,
        updatedAt: d.updatedAt && d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : null
    };
}

app.get('/api/admin/repertorios', authenticateJWT, async (req, res) => {
    try {
        const snapshot = await repertoriosCollection.orderBy('date', 'asc').get();
        const data = snapshot.docs.map(serializeRepertorio);
        res.status(200).json(data);
    } catch (error) {
        console.error('admin/repertorios/list:', error);
        res.status(500).json({ message: 'Erro ao listar repertórios.' });
    }
});

app.post('/api/admin/repertorios', authenticateJWT, async (req, res) => {
    try {
        const { error, value } = validateRepertorioPayload(req.body);
        if (error) return res.status(400).json({ message: error });

        const docRef = await repertoriosCollection.add({
            ...value,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user?.userId || req.user?.email || 'admin'
        });

        res.status(200).json({ status: 200, id: docRef.id, message: 'Repertório criado com sucesso.' });
    } catch (error) {
        console.error('admin/repertorios/create:', error);
        res.status(500).json({ message: 'Erro ao criar repertório.' });
    }
});

app.put('/api/admin/repertorios/:id', authenticateJWT, async (req, res) => {
    try {
        const { error, value } = validateRepertorioPayload(req.body);
        if (error) return res.status(400).json({ message: error });

        const ref = repertoriosCollection.doc(req.params.id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ message: 'Repertório não encontrado.' });

        await ref.update({
            ...value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ status: 200, message: 'Repertório atualizado com sucesso.' });
    } catch (error) {
        console.error('admin/repertorios/update:', error);
        res.status(500).json({ message: 'Erro ao atualizar repertório.' });
    }
});

app.delete('/api/admin/repertorios/:id', authenticateJWT, async (req, res) => {
    try {
        const ref = repertoriosCollection.doc(req.params.id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ message: 'Repertório não encontrado.' });

        await ref.delete();
        res.status(200).json({ status: 200, message: 'Repertório excluído com sucesso.' });
    } catch (error) {
        console.error('admin/repertorios/delete:', error);
        res.status(500).json({ message: 'Erro ao excluir repertório.' });
    }
});

app.get('/api/public/repertorios', async (req, res) => {
    try {
        const snapshot = await repertoriosCollection.orderBy('date', 'asc').get();
        const data = snapshot.docs.map(serializeRepertorio);
        res.status(200).json(data);
    } catch (error) {
        console.error('public/repertorios/list:', error);
        res.status(500).json({ message: 'Erro ao listar repertórios.' });
    }
});

// --- 8.3 Rotas de Partituras (CRUD admin com upload de PDFs) ---

function safePdfName(originalName) {
    return String(originalName || 'arquivo.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function slugifyInstrumentName(name) {
    const slug = String(name || 'instrumento')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return slug || 'instrumento';
}

function serializePartitura(doc) {
    const d = doc.data();
    return {
        id: doc.id,
        name: d.name || '',
        fullScoreFileName: d.fullScoreFileName || '',
        fullScoreUrl: d.fullScoreUrl || '',
        parts: Array.isArray(d.parts) ? d.parts : [],
        createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null,
        updatedAt: d.updatedAt && d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : null
    };
}

// Lista completa para o painel admin (CRUD)
app.get('/api/admin/partituras', authenticateJWT, async (req, res) => {
    try {
        const snapshot = await partiturasCollection.orderBy('name', 'asc').get();
        const data = snapshot.docs.map(serializePartitura);
        res.status(200).json(data);
    } catch (error) {
        console.error('admin/partituras/list:', error);
        res.status(500).json({ message: 'Erro ao listar partituras.' });
    }
});

// Criação de uma nova partitura. Usa upload.any() porque o número de instrumentos é
// dinâmico: cada parte chega como um campo de arquivo próprio, nomeado 'partFile_<id>',
// e a lista de metadados (nome de cada instrumento) chega em 'partsMeta' como JSON.
app.post('/api/admin/partituras', authenticateJWT, upload.any(), async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });

        const name = String(req.body?.name || '').trim();
        if (!name) return res.status(400).json({ message: 'Informe o nome da partitura.' });

        let partsMeta = [];
        try {
            partsMeta = JSON.parse(req.body?.partsMeta || '[]');
            if (!Array.isArray(partsMeta)) partsMeta = [];
        } catch {
            return res.status(400).json({ message: 'Formato inválido para as partes por instrumento.' });
        }

        const filesByField = {};
        (req.files || []).forEach(f => { filesByField[f.fieldname] = f; });

        const fullScoreFile = filesByField['fullScoreFile'];
        if (!fullScoreFile) return res.status(400).json({ message: 'Selecione o arquivo PDF da partitura completa.' });
        if (fullScoreFile.mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'A partitura completa deve ser um arquivo PDF.' });
        }

        const fullScoreFileName = `partitura__completa__${Date.now()}-${safePdfName(fullScoreFile.originalname)}`;
        const fullScoreUrl = await storageAdapter.uploadBuffer(fullScoreFileName, fullScoreFile.buffer, fullScoreFile.mimetype);

        const parts = [];
        for (let i = 0; i < partsMeta.length; i++) {
            const meta = partsMeta[i] || {};
            const instrumentName = String(meta.instrumentName || '').trim();
            if (!instrumentName) continue;

            const partFile = filesByField[`partFile_${meta.id}`];
            if (!partFile) {
                return res.status(400).json({ message: `Selecione o arquivo PDF para o instrumento "${instrumentName}".` });
            }
            if (partFile.mimetype !== 'application/pdf') {
                return res.status(400).json({ message: `O arquivo do instrumento "${instrumentName}" deve ser um PDF.` });
            }

            const partFileName = `partitura__instrumento__${slugifyInstrumentName(instrumentName)}__${Date.now()}-${i}-${safePdfName(partFile.originalname)}`;
            const partUrl = await storageAdapter.uploadBuffer(partFileName, partFile.buffer, partFile.mimetype);
            parts.push({ id: meta.id || `${Date.now()}-${i}`, instrumentName, fileName: partFileName, url: partUrl });
        }

        const docRef = await partiturasCollection.add({
            name,
            fullScoreFileName,
            fullScoreUrl,
            parts,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user?.userId || req.user?.email || 'admin'
        });

        res.status(200).json({ status: 200, id: docRef.id, message: 'Partitura criada com sucesso.' });
    } catch (error) {
        console.error('admin/partituras/create:', error);
        res.status(500).json({ message: 'Erro ao criar partitura.' });
    }
});

// Atualização de uma partitura existente. A partitura completa e cada instrumento só são
// re-enviados para o storage se um novo arquivo tiver sido selecionado; caso contrário,
// o front-end manda 'existingUrl'/'existingFileName' em partsMeta e mantemos o que já existe.
app.put('/api/admin/partituras/:id', authenticateJWT, upload.any(), async (req, res) => {
    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });

        const ref = partiturasCollection.doc(req.params.id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ message: 'Partitura não encontrada.' });
        const existing = snap.data();

        const name = String(req.body?.name || '').trim();
        if (!name) return res.status(400).json({ message: 'Informe o nome da partitura.' });

        let partsMeta = [];
        try {
            partsMeta = JSON.parse(req.body?.partsMeta || '[]');
            if (!Array.isArray(partsMeta)) partsMeta = [];
        } catch {
            return res.status(400).json({ message: 'Formato inválido para as partes por instrumento.' });
        }

        const filesByField = {};
        (req.files || []).forEach(f => { filesByField[f.fieldname] = f; });

        let fullScoreFileName = existing.fullScoreFileName || '';
        let fullScoreUrl = existing.fullScoreUrl || '';
        const newFullScoreFile = filesByField['fullScoreFile'];
        if (newFullScoreFile) {
            if (newFullScoreFile.mimetype !== 'application/pdf') {
                return res.status(400).json({ message: 'A partitura completa deve ser um arquivo PDF.' });
            }
            fullScoreFileName = `partitura__completa__${Date.now()}-${safePdfName(newFullScoreFile.originalname)}`;
            fullScoreUrl = await storageAdapter.uploadBuffer(fullScoreFileName, newFullScoreFile.buffer, newFullScoreFile.mimetype);
        }
        if (!fullScoreUrl) {
            return res.status(400).json({ message: 'Selecione o arquivo PDF da partitura completa.' });
        }

        const parts = [];
        for (let i = 0; i < partsMeta.length; i++) {
            const meta = partsMeta[i] || {};
            const instrumentName = String(meta.instrumentName || '').trim();
            if (!instrumentName) continue;

            const newPartFile = filesByField[`partFile_${meta.id}`];
            if (newPartFile) {
                if (newPartFile.mimetype !== 'application/pdf') {
                    return res.status(400).json({ message: `O arquivo do instrumento "${instrumentName}" deve ser um PDF.` });
                }
                const partFileName = `partitura__instrumento__${slugifyInstrumentName(instrumentName)}__${Date.now()}-${i}-${safePdfName(newPartFile.originalname)}`;
                const partUrl = await storageAdapter.uploadBuffer(partFileName, newPartFile.buffer, newPartFile.mimetype);
                parts.push({ id: meta.id || `${Date.now()}-${i}`, instrumentName, fileName: partFileName, url: partUrl });
            } else if (meta.existingUrl) {
                parts.push({
                    id: meta.id || `${Date.now()}-${i}`,
                    instrumentName,
                    fileName: meta.existingFileName || '',
                    url: meta.existingUrl
                });
            } else {
                return res.status(400).json({ message: `Selecione o arquivo PDF para o instrumento "${instrumentName}".` });
            }
        }

        await ref.update({
            name,
            fullScoreFileName,
            fullScoreUrl,
            parts,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ status: 200, message: 'Partitura atualizada com sucesso.' });
    } catch (error) {
        console.error('admin/partituras/update:', error);
        res.status(500).json({ message: 'Erro ao atualizar partitura.' });
    }
});

// Exclusão de uma partitura (best-effort: também tenta apagar os PDFs do armazenamento,
// mas não bloqueia a exclusão do registro caso a limpeza de algum arquivo falhe)
app.delete('/api/admin/partituras/:id', authenticateJWT, async (req, res) => {
    try {
        const ref = partiturasCollection.doc(req.params.id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ message: 'Partitura não encontrada.' });
        const data = snap.data();

        const filesToDelete = [
            data.fullScoreFileName,
            ...(Array.isArray(data.parts) ? data.parts.map(p => p.fileName) : [])
        ].filter(Boolean);

        await Promise.all(filesToDelete.map(async (fileName) => {
            try {
                await storageAdapter.deleteObject(fileName);
            } catch (e) {
                console.error('admin/partituras/delete storage:', fileName, e.message);
            }
        }));

        await ref.delete();
        res.status(200).json({ status: 200, message: 'Partitura excluída com sucesso.' });
    } catch (error) {
        console.error('admin/partituras/delete:', error);
        res.status(500).json({ message: 'Erro ao excluir partitura.' });
    }
});

// --- 9. Rota de Contato SMTP ---

app.post('/', limiter, async (req, res) => {
    const { senderName, senderEmail, body, subject } = req.body;
    if (!SENDER_EMAIL || !SENDER_PASS) return res.status(500).send('Erro de config SMTP.');
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: SENDER_EMAIL, pass: SENDER_PASS } });
    const mailOptions = { from: `"${senderName}" <${SENDER_EMAIL}>`, to: TARGET_EMAIL, subject: subject || 'Novo Contato RJB', text: body };
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Mensagem enviada!');
    } catch (error) {
        res.status(500).send('Erro ao enviar e-mail.');
    }
});

app.delete('/api/admin/delete-member/:id', authenticateJWT, async (req, res) => {
    try {
        const memberId = req.params.id;
        await membersCollection.doc(memberId).delete();
        res.status(200).json({ status: 200, message: 'Membro excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        res.status(500).json({ message: 'Erro interno ao excluir membro.' });
    }
});

app.put('/api/admin/update-member/:id', authenticateJWT, async (req, res) => {
    try {
        const memberId = req.params.id;
        const updatedData = req.body;

        delete updatedData.id;
        delete updatedData.submittedAt;

        await membersCollection.doc(memberId).update(updatedData);

        res.status(200).json({ status: 200, message: 'Dados atualizados com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar membro:', error);
        res.status(500).json({ message: 'Erro ao atualizar dados no servidor.' });
    }
});

// --- 10. Rotas da Área Financeira ---

function requireFinanceAccess(req, res, next) {
    if (req.user.role !== 'financeiro' && req.user.role !== 'admin-financeiro' && req.user.role !== 'financeiro-view') {
        return res.status(403).json({ status: 403, message: 'Acesso negado. Área restrita ao financeiro.' });
    }
    next();
}

function requireFinanceWriteAccess(req, res, next) {
    if (req.user.role !== 'admin-financeiro') {
        return res.status(403).json({ status: 403, message: 'Acesso negado. Apenas administradores financeiros podem realizar esta operação.' });
    }
    next();
}

app.get('/api/finance/contributions', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const snapshot = await contributionsCollection.orderBy('month', 'desc').get();
        const data = [];
        snapshot.forEach(doc => {
            const contribution = { id: doc.id, ...doc.data() };
            if (contribution.month) contribution.month = parseInt(contribution.month);
            if (contribution.year) contribution.year = parseInt(contribution.year);
            data.push(contribution);
        });
        res.status(200).json({ contributions: data });
    } catch (error) {
        console.error('Erro ao buscar contribuições:', error);
        res.status(500).json({ message: 'Erro ao buscar contribuições.' });
    }
});

app.post('/api/finance/contributions', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { memberId, memberName, month, year, amount, status } = req.body;

        if (!memberId || !month || !year || !amount) {
            return res.status(400).json({ message: 'Campos obrigatórios: memberId, month, year, amount.' });
        }

        const contributionData = {
            memberId,
            memberName: memberName || '',
            month: parseInt(month),
            year: parseInt(year),
            amount: parseFloat(amount),
            status: status || 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.userId
        };

        const docRef = await contributionsCollection.add(contributionData);
        res.status(200).json({ status: 200, message: 'Contribuição registrada.', id: docRef.id });
    } catch (error) {
        console.error('Erro ao criar contribuição:', error);
        res.status(500).json({ message: 'Erro ao registrar contribuição.' });
    }
});

app.put('/api/finance/contributions/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.createdBy;

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.updatedBy = req.user.userId;

        await contributionsCollection.doc(id).update(updateData);
        res.status(200).json({ status: 200, message: 'Contribuição atualizada.' });
    } catch (error) {
        console.error('Erro ao atualizar contribuição:', error);
        res.status(500).json({ message: 'Erro ao atualizar contribuição.' });
    }
});

app.delete('/api/finance/contributions/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await contributionsCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Contribuição excluída.' });
    } catch (error) {
        console.error('Erro ao excluir contribuição:', error);
        res.status(500).json({ message: 'Erro ao excluir contribuição.' });
    }
});

app.get('/api/finance/deposits', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const snapshot = await depositsCollection.orderBy('depositDate', 'desc').get();
        const data = [];
        snapshot.forEach(doc => {
            const deposit = { id: doc.id, ...doc.data() };
            if (deposit.depositDate && deposit.depositDate.toDate) {
                deposit.depositDate = deposit.depositDate.toDate().toISOString();
            }
            if (deposit.createdAt && deposit.createdAt.toDate) {
                deposit.createdAt = deposit.createdAt.toDate().toISOString();
            }
            data.push(deposit);
        });
        res.status(200).json({ deposits: data });
    } catch (error) {
        console.error('Erro ao buscar depósitos:', error);
        res.status(500).json({ message: 'Erro ao buscar depósitos.' });
    }
});

app.post('/api/finance/deposits', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { memberId, memberName, amount, depositDate, description, receiptUrl } = req.body;

        if (!memberId || !amount || !depositDate) {
            return res.status(400).json({ message: 'Campos obrigatórios: memberId, amount, depositDate.' });
        }

        const depositData = {
            memberId,
            memberName: memberName || '',
            amount: parseFloat(amount),
            depositDate: admin.firestore.Timestamp.fromDate(new Date(depositDate)),
            description: description || '',
            receiptUrl: receiptUrl || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.userId
        };

        const docRef = await depositsCollection.add(depositData);
        res.status(200).json({ status: 200, message: 'Depósito registrado.', id: docRef.id });
    } catch (error) {
        console.error('Erro ao criar depósito:', error);
        res.status(500).json({ message: 'Erro ao registrar depósito.' });
    }
});

app.post('/api/finance/deposits/receipt', authenticateJWT, requireFinanceWriteAccess, upload.single('receipt'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente.' });

    try {
        if (!storageAdapter.storageReady()) return res.status(503).json({ message: 'Armazenamento indisponível.' });
        const fileName = `deposits/${Date.now()}-${req.file.originalname.replace(/ /g, '_')}`;
        const publicUrl = await storageAdapter.uploadBuffer(fileName, req.file.buffer, req.file.mimetype);
        res.status(200).json({ status: 200, message: 'Comprovante enviado.', receiptUrl: publicUrl });
    } catch (error) {
        console.error('Erro ao fazer upload do comprovante:', error);
        res.status(500).json({ message: 'Erro ao fazer upload.' });
    }
});

app.put('/api/finance/deposits/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.createdBy;

        if (updateData.depositDate) {
            updateData.depositDate = admin.firestore.Timestamp.fromDate(new Date(updateData.depositDate));
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.updatedBy = req.user.userId;

        await depositsCollection.doc(id).update(updateData);
        res.status(200).json({ status: 200, message: 'Depósito atualizado.' });
    } catch (error) {
        console.error('Erro ao atualizar depósito:', error);
        res.status(500).json({ message: 'Erro ao atualizar depósito.' });
    }
});

app.delete('/api/finance/deposits/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await depositsCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Depósito excluído.' });
    } catch (error) {
        console.error('Erro ao excluir depósito:', error);
        res.status(500).json({ message: 'Erro ao excluir depósito.' });
    }
});

app.get('/api/finance/expenses', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const snapshot = await expensesCollection.orderBy('expenseDate', 'desc').get();
        const data = [];
        snapshot.forEach(doc => {
            const expense = { id: doc.id, ...doc.data() };
            if (expense.expenseDate && expense.expenseDate.toDate) {
                expense.expenseDate = expense.expenseDate.toDate().toISOString();
            }
            if (expense.createdAt && expense.createdAt.toDate) {
                expense.createdAt = expense.createdAt.toDate().toISOString();
            }
            data.push(expense);
        });
        res.status(200).json({ expenses: data });
    } catch (error) {
        console.error('Erro ao buscar gastos:', error);
        res.status(500).json({ message: 'Erro ao buscar gastos.' });
    }
});

app.post('/api/finance/expenses', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { description, amount, expenseDate, category } = req.body;

        if (!description || !amount || !expenseDate) {
            return res.status(400).json({ message: 'Campos obrigatórios: description, amount, expenseDate.' });
        }

        const expenseData = {
            description,
            amount: parseFloat(amount),
            expenseDate: admin.firestore.Timestamp.fromDate(new Date(expenseDate)),
            category: category || 'outros',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.userId
        };

        const docRef = await expensesCollection.add(expenseData);
        res.status(200).json({ status: 200, message: 'Gasto registrado.', id: docRef.id });
    } catch (error) {
        console.error('Erro ao criar gasto:', error);
        res.status(500).json({ message: 'Erro ao registrar gasto.' });
    }
});

app.put('/api/finance/expenses/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.createdBy;

        if (updateData.expenseDate) {
            updateData.expenseDate = admin.firestore.Timestamp.fromDate(new Date(updateData.expenseDate));
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.updatedBy = req.user.userId;

        await expensesCollection.doc(id).update(updateData);
        res.status(200).json({ status: 200, message: 'Gasto atualizado.' });
    } catch (error) {
        console.error('Erro ao atualizar gasto:', error);
        res.status(500).json({ message: 'Erro ao atualizar gasto.' });
    }
});

app.delete('/api/finance/expenses/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await expensesCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Gasto excluído.' });
    } catch (error) {
        console.error('Erro ao excluir gasto:', error);
        res.status(500).json({ message: 'Erro ao excluir gasto.' });
    }
});

app.get('/api/finance/reports/payments', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const { year, month } = req.query;

        const membersSnapshot = await membersCollection.get();
        const members = [];
        membersSnapshot.forEach(doc => members.push({ id: doc.id, ...doc.data() }));

        let contributionsQuery = contributionsCollection;
        if (year) {
            contributionsQuery = contributionsQuery.where('year', '==', parseInt(year));
        }
        if (month) {
            contributionsQuery = contributionsQuery.where('month', '==', parseInt(month));
        }

        const contributionsSnapshot = await contributionsQuery.get();
        const contributions = [];
        contributionsSnapshot.forEach(doc => contributions.push({ id: doc.id, ...doc.data() }));

        const depositsSnapshot = await depositsCollection.get();
        const deposits = [];
        depositsSnapshot.forEach(doc => {
            const deposit = { id: doc.id, ...doc.data() };
            if (deposit.depositDate && deposit.depositDate.toDate) {
                deposit.depositDate = deposit.depositDate.toDate().toISOString();
            }
            deposits.push(deposit);
        });

        const MONTHLY_CONTRIBUTION_AMOUNT = 20.00;
        const ANNUAL_AMOUNT_2026 = 240.00;
        const BASE_YEAR = 2026;

        const report = members.map(member => {
            const memberContributions = contributions.filter(c => c.memberId === member.id);
            const memberDeposits = deposits.filter(d => d.memberId === member.id);

            let memberStartDate = new Date();
            if (member.submittedAt) {
                if (member.submittedAt.toDate && typeof member.submittedAt.toDate === 'function') {
                    memberStartDate = member.submittedAt.toDate();
                } else if (member.submittedAt.seconds) {
                    memberStartDate = new Date(member.submittedAt.seconds * 1000);
                } else if (typeof member.submittedAt === 'string') {
                    memberStartDate = new Date(member.submittedAt);
                }
            }

            const paidMonths = memberContributions
                .filter(c => c.status === 'paid')
                .map(c => ({ month: c.month, year: c.year }))
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });

            const lastPaidMonth = paidMonths.length > 0 ? paidMonths[0] : null;

            const totalPaid = memberDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);

            const totalPaid2026FromDeposits = memberDeposits
                .filter(d => {
                    if (!d.depositDate) return false;
                    let depositDate;
                    if (d.depositDate.toDate && typeof d.depositDate.toDate === 'function') {
                        depositDate = d.depositDate.toDate();
                    } else if (d.depositDate.seconds) {
                        depositDate = new Date(d.depositDate.seconds * 1000);
                    } else if (typeof d.depositDate === 'string') {
                        depositDate = new Date(d.depositDate);
                    } else {
                        return false;
                    }
                    return depositDate.getFullYear() >= BASE_YEAR;
                })
                .reduce((sum, d) => sum + (d.amount || 0), 0);

            const totalPaid2026FromContributions = memberContributions
                .filter(c => {
                    if (c.status !== 'paid') return false;
                    const year = parseInt(c.year);
                    return year >= BASE_YEAR;
                })
                .reduce((sum, c) => sum + (c.amount || 0), 0);

            const totalPaid2026 = totalPaid2026FromDeposits + totalPaid2026FromContributions;

            const paidMonthsSet = new Set();
            memberContributions
                .filter(c => c.status === 'paid')
                .forEach(c => {
                    const year = parseInt(c.year);
                    const month = parseInt(c.month);
                    paidMonthsSet.add(`${year}-${month}`);
                });

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            let pendingMonths = [];

            if (currentYear >= BASE_YEAR) {
                const startYear = BASE_YEAR;
                const endYear = currentYear;

                for (let y = startYear; y <= endYear; y++) {
                    const startM = 1;
                    const endM = (y === currentYear) ? currentMonth : 12;

                    for (let m = startM; m <= endM; m++) {
                        if (!paidMonthsSet.has(`${y}-${m}`)) {
                            pendingMonths.push({ month: m, year: y });
                        }
                    }
                }
            }

            let totalPending = ANNUAL_AMOUNT_2026 - totalPaid2026;
            if (totalPending < 0) {
                totalPending = 0;
            }

            if (totalPaid2026 === 0) {
                totalPending = ANNUAL_AMOUNT_2026;
            }

            const pendingContributions = memberContributions.filter(c => c.status === 'pending');

            return {
                memberId: member.id,
                memberName: member.name,
                lastPaidMonth: lastPaidMonth ? `${lastPaidMonth.month}/${lastPaidMonth.year}` : 'Nunca',
                totalPaid,
                totalPending,
                pendingMonths: pendingMonths.length,
                pendingContributions: pendingContributions.length,
                expectedMonthlyAmount: MONTHLY_CONTRIBUTION_AMOUNT,
                annualAmount2026: ANNUAL_AMOUNT_2026
            };
        });

        report.sort((a, b) => {
            const nameA = (a.memberName || '').toLowerCase().trim();
            const nameB = (b.memberName || '').toLowerCase().trim();
            return nameA.localeCompare(nameB, 'pt-BR');
        });

        res.status(200).json({ report });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório.' });
    }
});

app.get('/api/finance/reports/member/:memberId', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const { memberId } = req.params;

        const contributionsSnapshot = await contributionsCollection.where('memberId', '==', memberId).orderBy('year', 'desc').orderBy('month', 'desc').get();
        const depositsSnapshot = await depositsCollection.where('memberId', '==', memberId).orderBy('depositDate', 'desc').get();

        const contributions = [];
        contributionsSnapshot.forEach(doc => {
            const contrib = { id: doc.id, ...doc.data() };
            if (contrib.createdAt && contrib.createdAt.toDate) {
                contrib.createdAt = contrib.createdAt.toDate().toISOString();
            }
            contributions.push(contrib);
        });

        const deposits = [];
        depositsSnapshot.forEach(doc => {
            const deposit = { id: doc.id, ...doc.data() };
            if (deposit.depositDate && deposit.depositDate.toDate) {
                deposit.depositDate = deposit.depositDate.toDate().toISOString();
            }
            if (deposit.createdAt && deposit.createdAt.toDate) {
                deposit.createdAt = deposit.createdAt.toDate().toISOString();
            }
            deposits.push(deposit);
        });

        res.status(200).json({ contributions, deposits });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico.' });
    }
});

// Listener em 0.0.0.0 para o Cloud Run conseguir fazer o health check na porta 8080
app.listen(PORT, '0.0.0.0', () => {
    console.log(`RJB Backend Produção na porta ${PORT}`);
    setImmediate(initFirebaseAndGCS);
});