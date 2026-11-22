import fs from 'fs';
import path from 'path';

const src = path.resolve(process.cwd(), 'frontend/dist');
const dest = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('[Build] Successfully mirrored frontend/dist to root dist/');
}
