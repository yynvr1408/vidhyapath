import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'vidyapath-assets';
const publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/+$/, '');

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey);
}

// S3Client configured specifically for Cloudflare R2 object storage
const r2Client = isR2Configured()
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

/**
 * Uploads an in-memory buffer directly to Cloudflare R2.
 * Never writes to local disk, guaranteeing persistence across Render ephemeral restarts.
 *
 * @param buffer - File content in memory
 * @param key - Storage key / filename
 * @param contentType - MIME type (e.g. 'image/jpeg', 'audio/webm', 'application/pdf')
 * @returns Public URL on Cloudflare R2 (or in-memory Base64 data URI in dev if R2 unconfigured)
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const safeKey = key.replace(/[^A-Za-z0-9._-]/g, '_');

  if (r2Client && isR2Configured()) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType,
      });

      await r2Client.send(command);

      const domain = publicDomain || `https://${bucketName}.r2.dev`;
      const finalUrl = `${domain}/${safeKey}`;
      console.log(`[Cloudflare R2] Successfully uploaded ${safeKey} (${buffer.length} bytes) -> ${finalUrl}`);
      return finalUrl;
    } catch (err: any) {
      console.error('[Cloudflare R2] Upload error:', err.message);
      throw err;
    }
  }

  // Fallback for local development / testing without R2 credentials:
  // Return an in-memory Base64 Data URI so NO file is EVER written to ephemeral disk!
  console.log(`[R2 Storage: Dev Mode] R2 credentials not set. Returning in-memory Data URI for ${safeKey} (0 disk writes).`);
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

// Backward-compatible alias for existing imports
export const uploadToStorage = uploadToR2;
