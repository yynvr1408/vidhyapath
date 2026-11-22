import fs from 'fs';
import path from 'path';

// Load local backend configuration before service modules read process.env.
// Render supplies environment variables directly and needs no .env file.
for (const envPath of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../.env')]) {
  if (!fs.existsSync(envPath)) continue;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
