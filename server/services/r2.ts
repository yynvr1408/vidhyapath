import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'vidyapath-assets';

export function isR2Configured(): boolean {
  return !!(accountId && accessKeyId && secretAccessKey);
}

export function getStorageInfo(): {
  provider: 'cloudflare_r2' | 'local_disk';
  isConfigured: boolean;
  bucketOrDir: string;
} {
  if (isR2Configured()) {
    return {
      provider: 'cloudflare_r2',
      isConfigured: true,
      bucketOrDir: bucketName,
    };
  }
  return {
    provider: 'local_disk',
    isConfigured: false,
    bucketOrDir: 'public/uploads',
  };
}

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
 * Uploads a buffer to Cloudflare R2 object storage (or local disk fallback if R2 not configured).
 * Works 100% out of the box with zero external configuration or cloud costs.
 */
export async function uploadToStorage(
  fileName: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');

  if (r2Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: safeName,
        Body: buffer,
        ContentType: contentType,
      });

      await r2Client.send(command);
      const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://${bucketName}.r2.dev`;
      return `${publicDomain}/${safeName}`;
    } catch (err: any) {
      console.warn('[Cloudflare R2] Upload failed, falling back to local storage:', err.message);
    }
  }

  // Local zero-cost fallback storage in public/uploads/
  const uploadsDir = path.resolve(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${safeName}`;
}
