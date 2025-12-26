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
const SENDER_EMAIL = process.env.GMAIL_USER;
const SENDER_PASS = process.env.GMAIL_PASS;
const TARGET_EMAIL = 'contato.racionaljazzband@gmail.com, racionaljazzbandoficial@gmail.com';
const VALID_INVITE_KEYS = ['RJB-MEMBER-2025', 'RJB-TESTE-999'];
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-muito-forte-da-rjb-987654321';

const ADMIN_USERS = [
    { email: 'regente@racionaljazzband.com', password: 'SenhaSuperSecreta123', role: 'regente' },
    { email: 'naleribeiro@hotmail.com', password: 'naleribeiroRJB', role: 'admin' },
    { email: 'samara.oliver3012@gmail.com', password: 'samoliveiraRJB@1935', role: 'admin' },
    { email: 'adersontm@hotmail.com', password: 'R8mQ4ZpA', role: 'admin' },
    { email: 'teste@hotmail.com', password: '123456Joel', role: 'admin' },
    { email: 'clarinetabest@hotmail.com', password: 'u7#K9pZ$', role: 'admin' },
    { email: 'anapaulacmarciano@gmail.com', password: 'a8@J7uC$', role: 'admin' },
    { email: 'edilashirley@gmail.com', password: 'b5!T3gC$', role: 'admin' },
    { email: 'vivian.colombo@hotmail.com', password: 'V3%u1An$', role: 'admin' },
     { email: 'andressamqxs@gmail.com', password: 'A4@d3r$An', role: 'admin' },
];

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

// --- 3. Inicialização de Serviços (Firebase e GCS) ---
if (!admin.apps.length) {
    admin.initializeApp({});
}
const db = admin.firestore();
const membersCollection = db.collection('members');
const keysCollection = db.collection('inviteKeys'); // Coleção para controle de chaves únicas

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'rjb-admin-files-bucket';
const bucket = storage.bucket(BUCKET_NAME);

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
    // Adicionado 'tefa' à desestruturação
    const { inviteKey, name, instrument, email, phone,   city, state, tefa, termsVersion, termsAccepted } = req.body;
    const keyUpper = inviteKey?.toUpperCase();

    try {
        // Validação básica de obrigatoriedade no servidor
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

        // Adicionado 'tefa' ao documento salvo no Firestore
        await membersCollection.add({
            name, instrument, email, city, state, phone, tefa: tefa || "", phone, termsVersion, termsAccepted,
            registrationIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (!isMasterKey) {
            await keyDocRef.update({ used: true, usedBy: email, usedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        res.status(200).json({ status: 200, message: `Inscrição de ${name} concluída!` });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Erro ao processar cadastro.' });
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

// Listener imediato para Health Check
app.listen(PORT, () => console.log(`RJB Backend Produção na porta ${PORT}`));