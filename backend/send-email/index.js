// index.js (CÓDIGO COMPLETO, FINALIZADO E REFORÇADO CONTRA FALHAS DE INICIALIZAÇÃO)

const nodemailer = require('nodemailer');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); 
const admin = require('firebase-admin'); 
const jwt = require('jsonwebtoken'); 
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

// 1. Definição das Constantes de E-mail/Ambiente
const SENDER_EMAIL = process.env.GMAIL_USER;
const SENDER_PASS = process.env.GMAIL_PASS;
const TARGET_EMAIL = 'contato.racionaljazzband@gmail.com'; 

// --- Credenciais e Chaves ---
const VALID_INVITE_KEYS = [
    'RJB-MEMBER-2025',
    'RJB-JAZZ-101',
    'RJB-AUDICAO-007',
    'RJB-TESTE-999', 
];

const ADMIN_USERS = [
    { email: 'regente@racionaljazzband.com', password: 'SenhaSuperSecreta123', role: 'regente' },
];

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-muito-forte-da-rjb-987654321'; 

// --- Configuração do Servidor Express ---
const app = express();
const PORT = process.env.PORT || 8080; 

// 1. Configurações de CORS e JSON/BodyParser
app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.options('*', cors());   

// 2. CONFIGURAÇÃO DE RATE LIMIT (DEFESA CONTRA SPAM)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: {
        status: 429,
        message: "Muitas requisições deste IP. Tente novamente após 15 minutos."
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// 🚨 CORREÇÃO CRÍTICA: INICIA O SERVIDOR IMEDIATAMENTE 🚨
// Isso permite que o Cloud Run satisfaça o Health Check rapidamente.
app.listen(PORT, () => {
    console.log(`Servidor Express rodando e escutando na porta ${PORT} (Verificação de saúde OK).`);
});


// 2. BLOCO DE CÓDIGO CRÍTICO PARA DEBUG (AGORA ISOLADO)
process.on('uncaughtException', (err) => {
    console.error('ERRO FATAL NO PROCESSO NODE.JS:', err);
    process.exit(1); 
});
// --- FIM DO BLOCO DE DEBUG --


// --- INICIALIZAÇÃO DE SERVIÇOS LENTOS (Firebase Admin/Firestore) ---
let db = null;  
let membersCollection = null;

try {
    // Tenta inicializar o Admin
    admin.initializeApp({}); 
    console.log('Firebase Admin: Tenta inicializar.');
    
    // Se a inicialização do Admin foi bem-sucedida, define DB e Collection
    if (admin.apps.length > 0) {
        db = admin.firestore();
        membersCollection = db.collection('members'); 
        console.log('Firebase Admin/Firestore inicializado com sucesso.');
    } else {
        console.warn('Firebase Admin não pôde ser inicializado. admin.apps está vazio.');
    }
    
} catch (error) {
    // O processo continua, mas o DB está indisponível.
    console.error('ERRO FATAL CAPTURADO: O processo continuará sem acesso ao DB.', error.message);
    console.warn('Backend do Firestore NÃO PODE SER INICIALIZADO. Rotas de cadastro/relatórios retornarão 503.');
}
// --- FIM DA INICIALIZAÇÃO FIRESTORE ---


// --- INICIALIZAÇÃO GCS (Google Cloud Storage) e Multer ---
const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'rjb-admin-files-bucket';
const bucket = storage.bucket(BUCKET_NAME);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Limita a 5MB
    }
});
// --- FIM DA INICIALIZAÇÃO GCS ---


// --- FUNÇÃO DE PROTEÇÃO JWT (MIDDLEWARE) ---
/**
 * Middleware para verificar o JWT em rotas protegidas.
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization; 

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]; 

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                // Token inválido (expirado, modificado, etc.)
                return res.status(403).json({ status: 403, message: 'Sessão expirada ou Token inválido.' });
            }
            
            req.user = user; 
            next(); 
        });
    } else {
        // Token não fornecido
        return res.status(401).json({ status: 401, message: 'Autenticação necessária. Por favor, faça login.' });
    }
}


// ----------------------------------------------------
// -------------- DEFINIÇÃO DE TODAS AS ROTAS -----------
// ----------------------------------------------------

// Rota RAIZ (Servindo index.html)
app.get('/', (req, res) => {
    // __dirname é o diretório onde o index.js está.
    res.sendFile(__dirname + '/index.html');
});

/**
 * Rota POST ORIGINAL para receber a submissão do formulário de CONTATO.
 * URL: /
 */
app.post('/', limiter, async (req, res) => { 
    // 1. Validação
    if (!req.body) {
        return res.status(400).send('Corpo da requisição ausente.');
    }

    // 2. Extrair dados
    const { senderName, senderEmail, body, subject } = req.body;

    if (!senderName || !senderEmail || !body) {
        return res.status(400).send('Dados de formulário incompletos: nome, email e mensagem são obrigatórios.');
    }

    // 3. Verificação de Credenciais
    if (!SENDER_EMAIL || !SENDER_PASS) {
        console.error('ERRO CRÍTICO: Credenciais SMTP (GMAIL_USER/GMAIL_PASS) não configuradas no Cloud Run.');
        // Retorna 500 se as credenciais do Nodemailer estiverem faltando
        return res.status(500).send('Erro interno do servidor: As credenciais de envio de e-mail estão faltando.');
    }

    // 4. Configurar o transportador Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_PASS, 
        },
    });

    // 5. Construir as opções do E-mail
    const mailOptions = {
        from: `"${senderName} (Contato RJB)" <${SENDER_EMAIL}>`,
        to: TARGET_EMAIL, 
        subject: subject || `Nova Mensagem do Site: ${senderName}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #FFD700; border-radius: 8px;">
                <h2 style="color: #2A2A2A;">Detalhes do Contato</h2>
                <p><strong>De:</strong> ${senderName}</p>
                <p><strong>E-mail de Resposta:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                <h3 style="color: #2A2A2A;">Mensagem:</h3>
                <div style="padding: 15px; border: 1px solid #FFD700; background-color: #FFFBEA; border-radius: 5px;">
                    <p style="white-space: pre-wrap;">${body}</p>
                </div>
            </div>
        `,
    };

    // 6. Enviar o E-mail
    try {
        await transporter.sendMail(mailOptions);
        console.log(`E-mail enviado com sucesso de ${senderEmail} para ${TARGET_EMAIL}.`);
        res.status(200).send('Mensagem enviada com sucesso!');

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        res.status(500).send('Falha ao enviar e-mail. Verifique a App Password e as permissões do Google.');
    }
});

/**
 * Rota POST para receber o cadastro de novos MEMBROS (SALVA NO FIRESTORE).
 * URL: /api/register-member
 */
app.post('/api/register-member', limiter, async (req, res) => { 
    // --- VERIFICAÇÃO DO FIRESTORE (Retorna 503 se a inicialização falhou) ---
    if (!db || !membersCollection) {
        console.error('Erro: Serviço Firestore não está disponível.');
        return res.status(503).json({ status: 503, message: 'Serviço de cadastro temporariamente indisponível. Verifique os logs do Cloud Run.' });
    }
    // --- FIM DA VERIFICAÇÃO ---

    if (!req.body) {
        return res.status(400).json({ status: 400, message: 'Corpo da requisição ausente.' });
    }

    const { inviteKey, name, instrument, email, city, state } = req.body; 

    if (!inviteKey || !name || !instrument || !email || !city || !state) {
        return res.status(400).json({ status: 400, message: 'Dados incompletos: Todos os campos são obrigatórios.' });
    }

    if (!VALID_INVITE_KEYS.includes(inviteKey)) {
        return res.status(401).json({ status: 401, message: 'Chave de convite inválida ou expirada.' });
    }
    
    // Salva no Firestore
    const newMemberEntry = {
        name,
        instrument,
        email,
        city,     
        state,    
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        const docRef = await membersCollection.add(newMemberEntry);
        
        console.log(`Novo membro cadastrado: ${name}. Doc ID: ${docRef.id}`);
        
        return res.status(200).json({ 
            status: 200, 
            message: `Inscrição de ${name} registrada com sucesso!`,
            id: docRef.id
        });
    } catch (error) {
        console.error('ERRO AO SALVAR NO FIRESTORE:', error);
        return res.status(500).json({ 
            status: 500, 
            message: 'Erro interno ao salvar os dados do membro.'
        });
    }
});

/**
 * Rota POST para login de administradores. Emite um JWT.
 * URL: /api/admin/login
 */
app.post('/api/admin/login', limiter, (req, res) => {
    const { email, password } = req.body;

    const user = ADMIN_USERS.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ status: 401, message: 'E-mail ou senha incorretos.' });
    }

    const payload = {
        userId: user.email,
        role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: '24h'
    });
    
    console.log(`Login de administrador bem-sucedido para: ${user.email}.`);

    return res.status(200).json({ 
        status: 200, 
        message: 'Login bem-sucedido.', 
        token: token,
        role: user.role 
    });
});

/**
 * Rota GET para acessar o relatório de membros cadastrados.
 * PROTEGIDA POR JWT E BUSCANDO NO FIRESTORE.
 * URL: /api/reports/members
 */
app.get('/api/reports/members', authenticateJWT, async (req, res) => { 
    // --- VERIFICAÇÃO DO FIRESTORE ---
    if (!db || !membersCollection) {
        console.error('Erro: Serviço Firestore não está disponível para relatórios.');
        return res.status(503).json({ status: 503, message: 'Serviço de relatórios temporariamente indisponível. Verifique os logs do Cloud Run.' });
    }
    
    console.log(`Relatório acessado por: ${req.user.userId} (${req.user.role})`);
    
    // Função utilitária para agrupar por campo
    const groupBy = (array, key) => {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    };

    try {
        // 1. Busca todos os documentos da coleção de membros no Firestore
        const snapshot = await membersCollection.get();
        const allMembersData = [];
        
        snapshot.forEach(doc => {
            // Inclui o ID do documento e os dados
            allMembersData.push({ id: doc.id, ...doc.data() }); 
        });

        // 2. Processa os dados para relatórios
        const reportData = {
            totalMembers: allMembersData.length,
            membersByInstrument: groupBy(allMembersData, 'instrument'),
            membersByState: groupBy(allMembersData, 'state'),
            allMembers: allMembersData 
        };

        // 3. Retorna os dados do relatório
        return res.status(200).json(reportData);

    } catch (error) {
        console.error('ERRO AO BUSCAR RELATÓRIO NO FIRESTORE:', error);
        return res.status(500).json({ 
            status: 500, 
            message: 'Erro interno do servidor ao buscar o relatório.' 
        });
    }
});

/**
 * Rota GET para exportar a lista completa de membros em formato CSV.
 * PROTEGIDA POR JWT.
 * URL: /api/reports/members/csv
 */
app.get('/api/reports/members/csv', authenticateJWT, async (req, res) => { 
    if (!db || !membersCollection) {
        return res.status(503).json({ status: 503, message: 'Serviço de banco de dados indisponível.' });
    }

    try {
        const snapshot = await membersCollection.get();
        const allMembersData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Formata o timestamp do Firestore para algo legível, se existir
            const submittedAt = data.submittedAt && data.submittedAt.toDate ? data.submittedAt.toDate().toISOString() : '';
            
            allMembersData.push({ 
                id: doc.id, 
                name: data.name,
                instrument: data.instrument,
                email: data.email,
                city: data.city,
                state: data.state,
                submittedAt: submittedAt
            });
        });

        if (allMembersData.length === 0) {
            return res.status(404).json({ status: 404, message: 'Nenhum membro encontrado para exportação.' });
        }
        
        // 1. Cria o cabeçalho CSV
        const headers = ['ID', 'Nome', 'Instrumento', 'Email', 'Cidade', 'Estado', 'Data de Inscrição'];
        let csv = headers.join(',') + '\n';

        // 2. Preenche as linhas CSV
        allMembersData.forEach(member => {
            const values = [
                member.id,
                `"${member.name.replace(/"/g, '""')}"`, 
                `"${member.instrument.replace(/"/g, '""')}"`,
                member.email,
                member.city,
                member.state,
                member.submittedAt
            ];
            csv += values.join(',') + '\n';
        });

        // 3. Envia o arquivo CSV para download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="rjb_members_report.csv"');
        console.log(`Exportação CSV acessada por: ${req.user.userId}`);
        return res.status(200).send(csv);

    } catch (error) {
        console.error('ERRO AO EXPORTAR CSV:', error);
        return res.status(500).json({ 
            status: 500, 
            message: 'Erro interno ao gerar o relatório CSV.' 
        });
    }
});

/**
 * Rota GET para listar arquivos de anexo no Google Cloud Storage.
 * PROTEGIDA POR JWT.
 * URL: /api/attachments/list
 */
app.get('/api/attachments/list', authenticateJWT, async (req, res) => {
    try {
        // 1. Verifica se o bucket existe
        const [exists] = await bucket.exists();
        if (!exists) {
            console.error(`Bucket GCS não encontrado: ${BUCKET_NAME}`);
            return res.status(500).json({ status: 500, message: 'Bucket de armazenamento indisponível.' });
        }

        // 2. Lista os arquivos (blobs) no bucket
        const [files] = await bucket.getFiles();
        
        const fileList = files.map(file => ({
            name: file.name,
            size: file.metadata.size, // Tamanho em bytes
            uploaded: file.metadata.timeCreated,
            // URL pública para download (se for público) ou para uso interno (assinada)
            url: file.publicUrl(),
            // URL de download direta, para download forçado (se for privado, é preferível uma URL assinada)
            downloadUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(file.name)}` 
        }));

        console.log(`Lista de ${fileList.length} arquivos acessada por ${req.user.userId}`);
        return res.status(200).json(fileList);

    } catch (error) {
        console.error('ERRO AO LISTAR ARQUIVOS GCS:', error);
        return res.status(500).json({ status: 500, message: 'Erro interno ao listar anexos.' });
    }
});

/**
 * Rota POST para upload de um novo arquivo para o Cloud Storage.
 * PROTEGIDA POR JWT.
 * URL: /api/attachments/upload
 */
app.post('/api/attachments/upload', authenticateJWT, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 400, message: 'Nenhum arquivo enviado.' });
    }
    
    // O Multer armazena o arquivo em req.file (se usarmos memoryStorage)
    const file = req.file; 
    
    // Cria um nome de arquivo único ou usa o nome original
    const fileName = `${Date.now()}-${file.originalname.replace(/ /g, "_")}`;
    
    const blob = bucket.file(fileName);
    
    // Cria um stream de upload para o GCS
    const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
            contentType: file.mimetype,
            // Adiciona metadados sobre quem fez o upload
            metadata: {
                uploader: req.user.userId,
                originalName: file.originalname
            }
        }
    });

    blobStream.on('error', (err) => {
        console.error('ERRO NO UPLOAD DE GCS:', err);
        return res.status(500).json({ status: 500, message: 'Erro ao enviar o arquivo para o Cloud Storage.' });
    });

    blobStream.on('finish', () => {
        // Arquivo enviado com sucesso. Torna-o público (se desejar)
        // blob.makePublic().then(() => { ... });
        console.log(`Arquivo ${fileName} enviado por ${req.user.userId}.`);
        
        return res.status(200).json({ 
            status: 200, 
            message: 'Upload concluído com sucesso.', 
            fileName: fileName,
            publicUrl: blob.publicUrl()
        });
    });

    // Finaliza o stream de upload com o buffer do arquivo
    blobStream.end(file.buffer);
});

/**
 * Rota DELETE para excluir um arquivo do Cloud Storage.
 * PROTEGIDA POR JWT.
 * URL: /api/attachments/delete
 */
app.delete('/api/attachments/delete/:fileName', authenticateJWT, async (req, res) => {
    const { fileName } = req.params;
    
    if (!fileName) {
        return res.status(400).json({ status: 400, message: 'Nome do arquivo ausente.' });
    }

    try {
        const file = bucket.file(fileName);
        
        // Tenta deletar o arquivo
        await file.delete();
        
        console.log(`Arquivo ${fileName} excluído por ${req.user.userId}.`);
        return res.status(200).json({ status: 200, message: `Arquivo '${fileName}' excluído com sucesso.` });
        
    } catch (error) {
        // Se o arquivo não existir, GCS retorna um erro. 
        if (error.code === 404) {
             return res.status(404).json({ status: 404, message: `Arquivo '${fileName}' não encontrado.` });
        }
        console.error('ERRO AO DELETAR ARQUIVO GCS:', error);
        return res.status(500).json({ status: 500, message: 'Erro interno ao excluir o anexo.' });
    }
});