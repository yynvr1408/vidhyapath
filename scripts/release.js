import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetVerArg = process.argv[2];

if (!targetVerArg) {
  console.error('Usage: npm run release <version>');
  console.error('Examples:');
  console.error('  npm run release 1.0.1');
  console.error('  npm run release patch');
  console.error('  npm run release minor');
  process.exit(1);
}

// 1. Read package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const currentVersion = pkg.version;

let newVersion = targetVerArg.replace(/^v/, '');

if (['patch', 'minor', 'major'].includes(newVersion)) {
  const [maj, min, pat] = currentVersion.split('.').map(Number);
  if (newVersion === 'patch') newVersion = `${maj}.${min}.${pat + 1}`;
  if (newVersion === 'minor') newVersion = `${maj}.${min + 1}.0`;
  if (newVersion === 'major') newVersion = `${maj + 1}.0.0`;
}

if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid semver version: ${newVersion}. Expected format: X.Y.Z (e.g. 1.0.1)`);
  process.exit(1);
}

console.log(`Bumping Vidyapath version: v${currentVersion} -> v${newVersion}`);

// 2. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
console.log('✓ Updated package.json');

// 3. Update src/config/version.ts
const verPath = path.join(rootDir, 'src/config/version.ts');
const verContent = `// Central application version configuration\n// Keep in sync with package.json\nexport const APP_VERSION = '${newVersion}';\n`;
fs.writeFileSync(verPath, verContent, 'utf-8');
console.log('✓ Updated src/config/version.ts');

// 4. Git commit & tag
try {
  execSync(`git add package.json src/config/version.ts`, { stdio: 'inherit', cwd: rootDir });
  execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit', cwd: rootDir });
  console.log(`\n🎉 Successfully created release tag v${newVersion}!`);
  console.log('\nTo trigger GitHub Actions to build APK and publish release:');
  console.log(`  git push origin main --tags\n`);
} catch (err) {
  console.error('Git command failed:', err.message);
}
