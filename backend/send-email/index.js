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

// --- 1. Constantes e Ambiente (Preservadas do Original) ---
// Validar variáveis de ambiente críticas
const SENDER_EMAIL = process.env.GMAIL_USER;
const SENDER_PASS = process.env.GMAIL_PASS;
const TARGET_EMAIL = 'contato.racionaljazzband@gmail.com, racionaljazzbandoficial@gmail.com, andressamqxs@gmail.com';
const VALID_INVITE_KEYS = ['RJB-MEMBER-2025', 'RJB-TESTE-999'];
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-muito-forte-da-rjb-987654321';

// Validar variáveis críticas (mas não bloquear se faltarem - algumas rotas podem não precisar)
if (!SENDER_EMAIL || !SENDER_PASS) {
    console.warn('⚠️  AVISO: GMAIL_USER ou GMAIL_PASS não configurados. Funcionalidades de e-mail podem não funcionar.');
}
if (!JWT_SECRET || JWT_SECRET === 'chave-secreta-muito-forte-da-rjb-987654321') {
    console.warn('⚠️  AVISO: JWT_SECRET usando valor padrão. Configure uma chave secreta forte em produção.');
}

// Carregar usuários administradores — não derruba o processo se falhar (para o Cloud Run passar no health check)
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
let db, membersCollection, keysCollection, contributionsCollection, depositsCollection, expensesCollection, bucket, BUCKET_NAME;

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
        const storage = new Storage();
        BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'rjb-admin-files-bucket';
        bucket = storage.bucket(BUCKET_NAME);
        console.log(`✅ Google Cloud Storage inicializado. Bucket: ${BUCKET_NAME}`);
    } catch (error) {
        console.error('❌ Erro ao inicializar serviços (Firebase/GCS):', error);
        console.error('📋 Detalhes do erro:', error.message);
    }
}

// Middleware: rotas que precisam do Firestore retornam 503 até os serviços estarem prontos
app.use((req, res, next) => {
    if (!membersCollection && req.path !== '/api/public/health' && !req.path.startsWith('/api/public/health')) {
        return res.status(503).json({ message: 'Serviço temporariamente indisponível. Tente em alguns segundos.' });
    }
    next();
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
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

// Nova: Registra no banco a chave gerada pelo Front-end para torná-la válida
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

// --- 6. Rotas de Membros e Cadastro (Uso Único Implementado) ---

// --- No arquivo index.js, localize a rota app.post('/api/register-member' ---

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

        // Salva o membro no Firestore
        await membersCollection.add({
            name, instrument, email, city, state, phone, tefa: tefa || "", termsVersion, termsAccepted,
            registrationIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!isMasterKey) {
            await keyDocRef.update({ used: true, usedBy: email, usedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        // --- ENVIO DE E-MAILS ---
        const transporter = nodemailer.createTransport({ 
            service: 'gmail', 
            auth: { user: SENDER_EMAIL, pass: SENDER_PASS } 
        });

        // 1. E-mail de Boas-Vindas para o Membro
        const memberMailOptions = {
            from: `"Racional Jazz Band" <${SENDER_EMAIL}>`,
            to: email,
            subject: 'Confirmação de Inscrição - RJB',
            text: `Olá ${name}!\n\nSua inscrição na Racional Jazz Band foi concluída com sucesso.\n\nInstrumento: ${instrument}\nCidade: ${city}/${state}\n\nEm breve entraremos em contato para mais informações. Seja bem-vindo(a)!`
        };

        // 2. Notificação para a Administração da Banda
        const adminMailOptions = {
            from: `"Sistema RJB" <${SENDER_EMAIL}>`,
            to: TARGET_EMAIL,
            subject: `Novo Cadastro: ${name}`,
            text: `Um novo membro se cadastrou!\n\nNome: ${name}\nInstrumento: ${instrument}\nE-mail: ${email}\nTelefone: ${phone}\nLocal: ${city}/${state}\nChave utilizada: ${inviteKey}`
        };

        // Dispara os e-mails
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

// --- Estatísticas públicas (mapa da Home: componentes por estado) ---
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

// --- Mapa de palco (lista pública: primeiro nome, UF, instrumento) ---
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

// --- 7. Rotas de Relatórios (Preservadas) ---

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
        // Adicionada a coluna TEFA no cabeçalho
        let csv = 'ID,Nome,TEFA,Instrumento,Email,Contato,Cidade,Estado,Data\n';

        snapshot.forEach(doc => {
            const d = doc.data();
            const date = d.submittedAt ? d.submittedAt.toDate().toISOString() : "";
            // Incluindo o valor do campo tefa ou vazio se não existir
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

// --- 8. Rotas de Anexos GCS (Preservadas e Completas) ---

app.get('/api/attachments/list', authenticateJWT, async (req, res) => {
    try {
        const [files] = await bucket.getFiles();
        const fileList = files.map(file => ({
            name: file.name,
            size: file.metadata.size,
            uploaded: file.metadata.timeCreated,
            downloadUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(file.name)}`
        }));
        res.status(200).json(fileList);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar arquivos.' });
    }
});

app.post('/api/attachments/upload', authenticateJWT, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente.' });
    const fileName = `${Date.now()}-${req.file.originalname.replace(/ /g, "_")}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({ resumable: false, metadata: { contentType: req.file.mimetype } });

    blobStream.on('error', () => res.status(500).json({ message: 'Erro no upload.' }));
    blobStream.on('finish', () => res.status(200).json({ status: 200, message: 'Upload concluído.', publicUrl: blob.publicUrl() }));
    blobStream.end(req.file.buffer);
});

app.delete('/api/attachments/delete/:fileName', authenticateJWT, async (req, res) => {
    try {
        await bucket.file(req.params.fileName).delete();
        res.status(200).json({ status: 200, message: 'Arquivo excluído.' });
    } catch (error) {
        res.status(error.code === 404 ? 404 : 500).json({ message: 'Erro ao excluir.' });
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

// Rota para excluir um membro cadastrado (index.js)
app.delete('/api/admin/delete-member/:id', authenticateJWT, async (req, res) => {
    try {
        const memberId = req.params.id; //
        await membersCollection.doc(memberId).delete(); //
        res.status(200).json({ status: 200, message: 'Membro excluído com sucesso.' }); //
    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        res.status(500).json({ message: 'Erro interno ao excluir membro.' }); //
    }
});

// Rota para editar dados de um membro (Protegida)
app.put('/api/admin/update-member/:id', authenticateJWT, async (req, res) => {
    try {
        const memberId = req.params.id;
        const updatedData = req.body;

        // Impedir a alteração de campos sensíveis ou automáticos, se desejar
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

// Middleware para verificar acesso financeiro (role 'financeiro', 'admin-financeiro' ou 'financeiro-view')
function requireFinanceAccess(req, res, next) {
    if (req.user.role !== 'financeiro' && req.user.role !== 'admin-financeiro' && req.user.role !== 'financeiro-view') {
        return res.status(403).json({ status: 403, message: 'Acesso negado. Área restrita ao financeiro.' });
    }
    next();
}

// Middleware para verificar permissão de escrita (apenas 'admin-financeiro' pode criar/editar/excluir)
function requireFinanceWriteAccess(req, res, next) {
    if (req.user.role !== 'admin-financeiro') {
        return res.status(403).json({ status: 403, message: 'Acesso negado. Apenas administradores financeiros podem realizar esta operação.' });
    }
    next();
}

// Coleções do Firestore para área financeira (inicializadas em initFirebaseAndGCS)

// --- Contribuições Mensais (CRUD) ---

// Listar todas as contribuições
app.get('/api/finance/contributions', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const snapshot = await contributionsCollection.orderBy('month', 'desc').get();
        const data = [];
        snapshot.forEach(doc => {
            const contribution = { id: doc.id, ...doc.data() };
            // Garantir que month e year sejam números
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

// Criar nova contribuição
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

// Atualizar contribuição
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

// Excluir contribuição
app.delete('/api/finance/contributions/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await contributionsCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Contribuição excluída.' });
    } catch (error) {
        console.error('Erro ao excluir contribuição:', error);
        res.status(500).json({ message: 'Erro ao excluir contribuição.' });
    }
});

// --- Depósitos com Comprovantes (CRUD) ---

// Listar todos os depósitos
app.get('/api/finance/deposits', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const snapshot = await depositsCollection.orderBy('depositDate', 'desc').get();
        const data = [];
        snapshot.forEach(doc => {
            const deposit = { id: doc.id, ...doc.data() };
            // Converter Timestamp para ISO string se necessário
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

// Criar novo depósito
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

// Upload de comprovante de depósito
app.post('/api/finance/deposits/receipt', authenticateJWT, requireFinanceWriteAccess, upload.single('receipt'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente.' });
    
    try {
        const fileName = `deposits/${Date.now()}-${req.file.originalname.replace(/ /g, "_")}`;
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({ resumable: false, metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', () => res.status(500).json({ message: 'Erro no upload.' }));
        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(fileName)}`;
            res.status(200).json({ status: 200, message: 'Comprovante enviado.', receiptUrl: publicUrl });
        });
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Erro ao fazer upload do comprovante:', error);
        res.status(500).json({ message: 'Erro ao fazer upload.' });
    }
});

// Atualizar depósito
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

// Excluir depósito
app.delete('/api/finance/deposits/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await depositsCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Depósito excluído.' });
    } catch (error) {
        console.error('Erro ao excluir depósito:', error);
        res.status(500).json({ message: 'Erro ao excluir depósito.' });
    }
});

// --- Gastos da RJB (CRUD) ---

// Listar todos os gastos
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

// Criar novo gasto
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

// Atualizar gasto
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

// Excluir gasto
app.delete('/api/finance/expenses/:id', authenticateJWT, requireFinanceWriteAccess, async (req, res) => {
    try {
        await expensesCollection.doc(req.params.id).delete();
        res.status(200).json({ status: 200, message: 'Gasto excluído.' });
    } catch (error) {
        console.error('Erro ao excluir gasto:', error);
        res.status(500).json({ message: 'Erro ao excluir gasto.' });
    }
});

// --- Relatórios Financeiros ---

// Relatório de pagamentos e pendências
app.get('/api/finance/reports/payments', authenticateJWT, requireFinanceAccess, async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Buscar todos os membros
        const membersSnapshot = await membersCollection.get();
        const members = [];
        membersSnapshot.forEach(doc => members.push({ id: doc.id, ...doc.data() }));

        // Buscar contribuições
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

        // Buscar depósitos
        const depositsSnapshot = await depositsCollection.get();
        const deposits = [];
        depositsSnapshot.forEach(doc => {
            const deposit = { id: doc.id, ...doc.data() };
            if (deposit.depositDate && deposit.depositDate.toDate) {
                deposit.depositDate = deposit.depositDate.toDate().toISOString();
            }
            deposits.push(deposit);
        });

        // Constante: Valor mensal obrigatório de contribuição
        const MONTHLY_CONTRIBUTION_AMOUNT = 20.00;
        // Valor total anual obrigatório para 2026
        const ANNUAL_AMOUNT_2026 = 240.00; // 12 meses × R$ 20,00
        // Ano base para cálculo de pendências (zerar pendências anteriores)
        const BASE_YEAR = 2026;
        
        // Processar dados
        const report = members.map(member => {
            const memberContributions = contributions.filter(c => c.memberId === member.id);
            const memberDeposits = deposits.filter(d => d.memberId === member.id);
            
            // Data de cadastro do membro
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
            
            // Último mês pago
            const paidMonths = memberContributions
                .filter(c => c.status === 'paid')
                .map(c => ({ month: c.month, year: c.year }))
                .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });
            
            const lastPaidMonth = paidMonths.length > 0 ? paidMonths[0] : null;
            
            // Total pago (todos os depósitos, para histórico)
            const totalPaid = memberDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
            
            // Total pago apenas de 2026 em diante (para cálculo de pendência de 2026)
            // Considera depósitos de 2026 em diante
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
            
            // Considera também contribuições marcadas como "paid" de 2026 em diante
            const totalPaid2026FromContributions = memberContributions
                .filter(c => {
                    if (c.status !== 'paid') return false;
                    const year = parseInt(c.year);
                    return year >= BASE_YEAR;
                })
                .reduce((sum, c) => sum + (c.amount || 0), 0);
            
            // Total pago de 2026 em diante (soma de depósitos e contribuições)
            const totalPaid2026 = totalPaid2026FromDeposits + totalPaid2026FromContributions;
            
            // Criar conjunto de meses pagos (formato "YYYY-MM")
            // Garantir que month e year sejam números para comparação correta
            const paidMonthsSet = new Set();
            memberContributions
                .filter(c => c.status === 'paid')
                .forEach(c => {
                    const year = parseInt(c.year);
                    const month = parseInt(c.month);
                    paidMonthsSet.add(`${year}-${month}`);
                });
            
            // Calcular meses pendentes (apenas a partir de 2026)
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            let pendingMonths = [];
            
            // Zerar pendências anteriores a 2026 - considerar apenas 2026 em diante
            // Todos os membros começam com a mesma base em 2026
            if (currentYear >= BASE_YEAR) {
                // Calcular meses pendentes apenas de 2026 em diante
                const startYear = BASE_YEAR;
                const endYear = currentYear;
                
                for (let y = startYear; y <= endYear; y++) {
                    const startM = 1; // Sempre começa em janeiro
                    const endM = (y === currentYear) ? currentMonth : 12;
                    
                    for (let m = startM; m <= endM; m++) {
                        // Garantir comparação correta convertendo para string no mesmo formato
                        if (!paidMonthsSet.has(`${y}-${m}`)) {
                            pendingMonths.push({ month: m, year: y });
                        }
                    }
                }
            }
            
            // Calcular valor pendente baseado no valor anual de 2026 (R$ 240,00)
            // Valor Pendente = R$ 240,00 - Total Pago (apenas de 2026 em diante)
            // Se Total Pago 2026 >= R$ 240,00, então Valor Pendente = 0
            let totalPending = ANNUAL_AMOUNT_2026 - totalPaid2026;
            if (totalPending < 0) {
                totalPending = 0; // Não pode ser negativo
            }
            
            // Se não há pagamentos de 2026, o valor pendente deve ser R$ 240,00
            if (totalPaid2026 === 0) {
                totalPending = ANNUAL_AMOUNT_2026;
            }
            
            // Contribuições pendentes registradas manualmente (para referência)
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

        // Ordenar por nome alfabeticamente
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

// Histórico individual de pagamentos
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