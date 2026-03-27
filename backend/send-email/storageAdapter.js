/**
 * Armazenamento de ficheiros: Google Cloud Storage ou Cloudflare R2 (API S3).
 * Defina STORAGE_PROVIDER=r2 e as variáveis R2_* para usar R2; caso contrário usa GCS (bucket).
 */

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand
} = require('@aws-sdk/client-s3');

let storageType = 'gcs';
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
    storageType = 'gcs';
    gcsBucket = gcs.bucket;
    gcsBucketName = gcs.bucketName;
    r2Client = null;
}

function initR2FromEnv () {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicBase = trimBase(process.env.R2_PUBLIC_BASE_URL);
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
        return false;
    }
    storageType = 'r2';
    gcsBucket = null;
    gcsBucketName = '';
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
    return storageType === 'r2' && r2Client;
}

function isGCS () {
    return storageType === 'gcs' && gcsBucket;
}

function storageReady () {
    return isR2() || isGCS();
}

async function listFiles () {
    if (isR2()) {
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
    if (isGCS()) {
        const [files] = await gcsBucket.getFiles();
        return files.map((file) => ({
            name: file.name,
            size: file.metadata.size,
            uploaded: file.metadata.timeCreated,
            contentType: file.metadata.contentType || '',
            downloadUrl: `https://storage.googleapis.com/${gcsBucketName}/${encodeURIComponent(file.name)}`
        }));
    }
    throw new Error('Storage não configurado.');
}

/**
 * @returns {Promise<string>} URL pública
 */
async function uploadBuffer (key, buffer, contentType) {
    if (isR2()) {
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
    if (isGCS()) {
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
    throw new Error('Storage não configurado.');
}

async function copyObject (srcKey, destKey) {
    if (isR2()) {
        await r2Client.send(
            new CopyObjectCommand({
                Bucket: r2BucketName,
                Key: destKey,
                CopySource: copySourcePath(r2BucketName, srcKey)
            })
        );
        return;
    }
    if (isGCS()) {
        await gcsBucket.file(srcKey).copy(gcsBucket.file(destKey));
        return;
    }
    throw new Error('Storage não configurado.');
}

async function deleteObject (key) {
    if (isR2()) {
        await r2Client.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
        return;
    }
    if (isGCS()) {
        await gcsBucket.file(key).delete();
        return;
    }
    throw new Error('Storage não configurado.');
}

async function objectExists (key) {
    if (isR2()) {
        try {
            await r2Client.send(new HeadObjectCommand({ Bucket: r2BucketName, Key: key }));
            return true;
        } catch (e) {
            if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NotFound') return false;
            throw e;
        }
    }
    if (isGCS()) {
        const [exists] = await gcsBucket.file(key).exists();
        return exists;
    }
    throw new Error('Storage não configurado.');
}

module.exports = {
    initGCS,
    initR2FromEnv,
    isR2,
    isGCS,
    storageReady,
    storageType: () => storageType,
    listFiles,
    uploadBuffer,
    copyObject,
    deleteObject,
    objectExists,
    publicUrlForKey,
    gcsPublicUrl: (key) =>
        isGCS() ? `https://storage.googleapis.com/${gcsBucketName}/${encodeURIComponent(key)}` : publicUrlForKey(key)
};
