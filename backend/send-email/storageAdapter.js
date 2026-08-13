/**
 * Armazenamento dual:
 * - GCS → anexos/mídia/financeiro (bucket admin)
 * - Cloudflare R2 → partituras PDF/SIB (bucket rjb-sheets)
 *
 * Em produção os dois devem estar activos. R2 incompleto não derruba o GCS.
 */

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand
} = require('@aws-sdk/client-s3');

let gcsBucket = null;
let gcsBucketName = '';

let r2Client = null;
let r2BucketName = '';
let r2PublicBase = '';

function trimBase (u) {
    return String(u || '').replace(/\/+$/, '');
}

/**
 * @param {{ bucket: import('@google-cloud/storage').Bucket, bucketName: string }} gcs
 */
function initGCS (gcs) {
    gcsBucket = gcs.bucket;
    gcsBucketName = gcs.bucketName;
}

function initR2FromEnv () {
    const accountId = String(process.env.R2_ACCOUNT_ID || '').trim();
    const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
    const bucket = String(process.env.R2_BUCKET_NAME || '').trim();
    const publicBase = trimBase(process.env.R2_PUBLIC_BASE_URL);
    const missing = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    if (!bucket) missing.push('R2_BUCKET_NAME');
    if (!publicBase) missing.push('R2_PUBLIC_BASE_URL');
    if (missing.length) {
        console.warn(`⚠️ R2 incompleto — faltam: ${missing.join(', ')}`);
        r2Client = null;
        r2BucketName = '';
        r2PublicBase = '';
        return false;
    }
    r2BucketName = bucket;
    r2PublicBase = publicBase;
    r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey }
    });
    console.log(`✅ Cloudflare R2 inicializado. Bucket: ${r2BucketName}`);
    return true;
}

/** CopySource S3/R2: bucket + key com barras codificadas como %2F */
function copySourcePath (bucket, key) {
    return `${bucket}/${encodeURIComponent(key)}`;
}

function publicUrlForKey (key) {
    const segments = key.split('/').map((s) => encodeURIComponent(s));
    return `${r2PublicBase}/${segments.join('/')}`;
}

function isR2 () {
    return Boolean(r2Client && r2BucketName);
}

function isGCS () {
    return Boolean(gcsBucket && gcsBucketName);
}

/** Mídia/anexos (GCS). */
function mediaReady () {
    return isGCS();
}

/** Partituras (R2). */
function sheetsReady () {
    return isR2();
}

/** Compat: true se GCS ou R2 estiver pronto. */
function storageReady () {
    return mediaReady() || sheetsReady();
}

function storageType () {
    if (isR2() && isGCS()) return 'dual';
    if (isR2()) return 'r2';
    if (isGCS()) return 'gcs';
    return 'none';
}

function requireGCS () {
    if (!isGCS()) throw new Error('Google Cloud Storage não configurado.');
}

function requireR2 () {
    if (!isR2()) throw new Error('Cloudflare R2 não configurado.');
}

async function listFiles () {
    requireGCS();
    const [files] = await gcsBucket.getFiles();
    return files.map((file) => ({
        name: file.name,
        size: file.metadata.size,
        uploaded: file.metadata.timeCreated,
        contentType: file.metadata.contentType || '',
        downloadUrl: `https://storage.googleapis.com/${gcsBucketName}/${encodeURIComponent(file.name)}`
    }));
}

/**
 * Upload de mídia/anexos → GCS.
 * @returns {Promise<string>} URL pública
 */
async function uploadBuffer (key, buffer, contentType) {
    requireGCS();
    const blob = gcsBucket.file(key);
    await new Promise((resolve, reject) => {
        const ws = blob.createWriteStream({
            resumable: false,
            metadata: { contentType: contentType || 'application/octet-stream' }
        });
        ws.on('error', reject);
        ws.on('finish', resolve);
        ws.end(buffer);
    });
    return `https://storage.googleapis.com/${gcsBucketName}/${encodeURIComponent(key)}`;
}

async function copyObject (srcKey, destKey) {
    requireGCS();
    await gcsBucket.file(srcKey).copy(gcsBucket.file(destKey));
}

async function deleteObject (key) {
    requireGCS();
    await gcsBucket.file(key).delete();
}

async function objectExists (key) {
    requireGCS();
    const [exists] = await gcsBucket.file(key).exists();
    return exists;
}

/**
 * Upload de partitura (PDF/SIB) → R2.
 * @returns {Promise<string>} URL pública R2
 */
async function uploadSheet (key, buffer, contentType) {
    requireR2();
    await r2Client.send(
        new PutObjectCommand({
            Bucket: r2BucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType || 'application/octet-stream'
        })
    );
    return publicUrlForKey(key);
}

async function copySheet (srcKey, destKey) {
    requireR2();
    await r2Client.send(
        new CopyObjectCommand({
            Bucket: r2BucketName,
            Key: destKey,
            CopySource: copySourcePath(r2BucketName, srcKey)
        })
    );
}

async function deleteSheet (key) {
    requireR2();
    await r2Client.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
}

async function sheetExists (key) {
    requireR2();
    try {
        await r2Client.send(new HeadObjectCommand({ Bucket: r2BucketName, Key: key }));
        return true;
    } catch (e) {
        if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NotFound') return false;
        throw e;
    }
}

/** Lista objectos no bucket R2 (diagnóstico / admin). */
async function listSheets () {
    requireR2();
    const out = [];
    let ContinuationToken;
    do {
        const resp = await r2Client.send(
            new ListObjectsV2Command({
                Bucket: r2BucketName,
                ContinuationToken
            })
        );
        for (const obj of resp.Contents || []) {
            out.push({
                name: obj.Key,
                size: String(obj.Size ?? ''),
                uploaded: obj.LastModified ? obj.LastModified.toISOString() : '',
                contentType: '',
                downloadUrl: publicUrlForKey(obj.Key)
            });
        }
        ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (ContinuationToken);
    return out;
}

module.exports = {
    initGCS,
    initR2FromEnv,
    isR2,
    isGCS,
    mediaReady,
    sheetsReady,
    storageReady,
    storageType,
    listFiles,
    uploadBuffer,
    copyObject,
    deleteObject,
    objectExists,
    uploadSheet,
    copySheet,
    deleteSheet,
    sheetExists,
    listSheets,
    publicUrlForKey,
    gcsPublicUrl: (key) =>
        `https://storage.googleapis.com/${gcsBucketName}/${encodeURIComponent(key)}`
};
