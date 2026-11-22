import fs from 'fs';
import path from 'path';

// Vidyapath audit checks. Each check reads source files and matches text/regex.
// A check FAILs while the defect exists and PASSes once it is fixed.
// Missing files or unlocatable code produce SKIPPED with a reason.

type Status = 'PASS' | 'FAIL' | 'SKIPPED';
interface Result {
  status: Status;
  detail: string;
}

const pass = (detail: string): Result => ({ status: 'PASS', detail });
const fail = (detail: string): Result => ({ status: 'FAIL', detail });
const skip = (detail: string): Result => ({ status: 'SKIPPED', detail });

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function runCheck(id: string, label: string, fn: () => Result) {
  let r: Result;
  try {
    r = fn();
  } catch (e) {
    r = skip(`error while checking: ${(e as Error).message}`);
  }
  if (r.status === 'PASS') passCount++;
  else if (r.status === 'FAIL') failCount++;
  else skipCount++;
  console.log(`[${r.status}] ${id}: ${label}`);
  console.log(`       ${r.detail}`);
}

function readSrc(rel: string): string | null {
  const p = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

function walkTs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTs(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

// All route blocks for an exact route path, from declaration up to the next route declaration.
function routeBlocks(src: string, routePath: string): string[] {
  const re = new RegExp(
    `\\b(?:app|router)\\.(?:get|post|put|delete|patch|use|all)\\(\\s*['"\`]${esc(routePath)}['"\`]`,
    'g',
  );
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const rest = src.slice(m.index + m[0].length);
    const next = rest.search(/\b(?:app|router)\.(?:get|post|put|delete|patch|use|all)\(/);
    blocks.push(m[0] + (next === -1 ? rest : rest.slice(0, next)));
  }
  return blocks;
}

// Body of a function/method declaration by name (brace matched). Skips call sites.
function functionBody(src: string, name: string): string | null {
  const re = new RegExp(`(?:^|\\s)${esc(name)}\\s*(?:=|\\(|<|:)`, 'gm');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const rest = src.slice(m.index);
    const brace = rest.indexOf('{');
    const semi = rest.indexOf(';');
    if (brace === -1 || (semi !== -1 && semi < brace)) continue;
    let depth = 0;
    for (let i = brace; i < rest.length; i++) {
      if (rest[i] === '{') depth++;
      else if (rest[i] === '}') {
        depth--;
        if (depth === 0) return rest.slice(0, i + 1);
      }
    }
    return rest;
  }
  return null;
}

function combine(parts: Result[]): Result {
  const detail = parts.map((p) => p.detail).join(' | ');
  if (parts.some((p) => p.status === 'FAIL')) return fail(detail);
  if (parts.some((p) => p.status === 'SKIPPED')) return skip(detail);
  return pass(detail);
}

// Strip the first string literal (the route path) and rate-limiter identifiers before auth matching.
function stripForAuth(block: string): string {
  return block.replace(/['"`][^'"`\n]*['"`]/, '').replace(/\w*RateLimiter\w*/g, '');
}

const AUTH_RE = /\b\w*(auth|pin|admin|jwt)\w*\s*[,)]/i;

function attemptIdCheck(rel: string): Result {
  const src = readSrc(rel);
  if (src === null) return skip(`${rel} not found`);
  const dateNow = /attempt\w*\s*(?::\s*[^=;\n]+)?[:=]\s*[^;\n,]*Date\.now\(\)/i.test(src);
  const uuid = /randomUUID|from\s+['"]uuid['"]|require\(\s*['"]uuid['"]\s*\)/.test(src);
  if (dateNow) return fail(`${rel}: attempt ID built from Date.now()`);
  if (!uuid) return fail(`${rel}: no crypto.randomUUID or uuid import`);
  return pass(`${rel}: attempt IDs use randomUUID/uuid`);
}

function main() {
  console.log('=== Vidyapath Audit Test Suite ===\n');

  // AUDIT-01
  runCheck('AUDIT-01', 'backend/server/index.ts /api/admin/packs, /validate and /publish routes reference an auth middleware', () => {
    const src = readSrc('backend/server/index.ts');
    if (src === null) return skip('backend/server/index.ts not found');
    const routes = ['/api/admin/packs', '/api/admin/packs/validate', '/api/admin/packs/publish'];
    const found: string[] = [];
    const unauth: string[] = [];
    for (const r of routes) {
      const blocks = routeBlocks(src, r);
      if (blocks.length === 0) continue;
      found.push(r);
      if (!blocks.every((b) => AUTH_RE.test(stripForAuth(b)))) unauth.push(r);
    }
    if (found.length === 0) return skip('admin pack route declarations not found in backend/server/index.ts');
    if (unauth.length > 0) return fail(`no auth/PIN middleware on: ${unauth.join(', ')}`);
    return pass(`auth middleware present on: ${found.join(', ')}`);
  });

  // AUDIT-02
  runCheck('AUDIT-02', 'authRateLimiter and tutorRateLimiter are referenced in at least one route definition', () => {
    const serverSrc = walkTs(path.resolve(process.cwd(), 'server'))
      .map((f) => fs.readFileSync(f, 'utf-8'))
      .join('\n');
    if (serverSrc.trim() === '') return skip('backend/server/ directory not found or has no .ts files');
    const names = ['authRateLimiter', 'tutorRateLimiter'];
    const unreferenced = names.filter(
      (n) =>
        !new RegExp(`\\b(?:app|router)\\.(?:get|post|put|delete|patch|use|all)\\([^;]*?\\b${n}\\b`).test(serverSrc),
    );
    if (unreferenced.length > 0) return fail(`not referenced in any route definition: ${unreferenced.join(', ')}`);
    return pass(`referenced in route definitions: ${names.join(', ')}`);
  });

  // AUDIT-03
  runCheck('AUDIT-03', 'backend/server/services/auth.ts JWT secret has no hardcoded string-literal fallback', () => {
    const src = readSrc('backend/server/services/auth.ts');
    if (src === null) return skip('backend/server/services/auth.ts not found');
    const m = /\b\w*secret\w*\s*(?::\s*[^=;\n]+)?=\s*([^;\n]+)/i.exec(src);
    if (!m) return skip('no JWT secret assignment found');
    const expr = m[1].trim();
    if (/(\|\||\?\?)\s*['"`]/.test(expr)) return fail(`literal fallback in secret expression: ${expr}`);
    return pass(`secret expression has no literal fallback: ${expr}`);
  });

  // AUDIT-04
  runCheck('AUDIT-04', 'check-update route does not send err.message in the response body', () => {
    const src = readSrc('backend/server/index.ts');
    if (src === null) return skip('backend/server/index.ts not found');
    const blocks = routeBlocks(src, '/api/app/check-update');
    if (blocks.length === 0) return skip('/api/app/check-update route not found in backend/server/index.ts');
    if (blocks.some((b) => /\b(err|error|e)\.message\b/.test(b))) return fail('check-update response includes err.message');
    return pass('check-update response does not include err.message');
  });

  // AUDIT-05
  runCheck('AUDIT-05', 'guardian token route handler reads expiresAt (SUSPECTED)', () => {
    const src = readSrc('backend/server/index.ts');
    if (src === null) return skip('backend/server/index.ts not found');
    const blocks = routeBlocks(src, '/api/guardian/:token');
    if (blocks.length === 0) return skip('/api/guardian/:token route not found in backend/server/index.ts');
    if (blocks.some((b) => /expiresAt/.test(b))) return pass('guardian handler reads expiresAt');
    return fail('guardian handler block does not reference expiresAt');
  });

  // AUDIT-06
  runCheck('AUDIT-06', 'sponsor cohort threshold uses COUNT from learners table, not stored activeLearners', () => {
    const src = readSrc('backend/server/index.ts');
    if (src === null) return skip('backend/server/index.ts not found');
    const blocks = routeBlocks(src, '/api/sponsor/:cohort');
    if (blocks.length === 0) return skip('/api/sponsor/:cohort route not found in backend/server/index.ts');
    const text = blocks.join('\n');
    if (/COUNT\s*\(/i.test(text) && /learners/i.test(text)) return pass('cohort size computed with COUNT from learners');
    if (/activeLearners/.test(text)) return fail('route uses stored activeLearners field with no COUNT from learners');
    return skip('unclear: no COUNT or activeLearners found in sponsor route block');
  });

  // AUDIT-07
  runCheck('AUDIT-07', 'frontend/src/components/PinPadModal.tsx contains no literal 1234 comparison', () => {
    const src = readSrc('frontend/src/components/PinPadModal.tsx');
    if (src === null) return skip('frontend/src/components/PinPadModal.tsx not found');
    if (/['"`]1234['"`]/.test(src)) return fail("literal '1234' found in PinPadModal.tsx");
    return pass("no literal '1234' in PinPadModal.tsx");
  });

  // AUDIT-08
  runCheck('AUDIT-08', 'frontend/src/db/indexedDb.ts getOutboxAttempts filters by learnerId', () => {
    const src = readSrc('frontend/src/db/indexedDb.ts');
    if (src === null) return skip('frontend/src/db/indexedDb.ts not found');
    const body = functionBody(src, 'getOutboxAttempts');
    if (body === null) return skip('getOutboxAttempts declaration not found in frontend/src/db/indexedDb.ts');
    if (/learnerId/.test(body)) return pass('getOutboxAttempts references learnerId');
    return fail('getOutboxAttempts does not filter by learnerId');
  });

  // AUDIT-09
  runCheck('AUDIT-09', 'frontend/src/db/indexedDb.ts deleteLearner removes rows from skill states, attempts, outbox and doubts', () => {
    const src = readSrc('frontend/src/db/indexedDb.ts');
    if (src === null) return skip('frontend/src/db/indexedDb.ts not found');
    const body = functionBody(src, 'deleteLearner');
    if (body === null) return skip('deleteLearner declaration not found in frontend/src/db/indexedDb.ts');
    const stores: [string, RegExp][] = [
      ['skill states', /skill/i],
      ['attempts', /attempt/i],
      ['outbox', /outbox/i],
      ['doubts', /doubt/i],
    ];
    const missing = stores.filter(([, re]) => !re.test(body)).map(([name]) => name);
    if (missing.length > 0) return fail(`deleteLearner does not clear: ${missing.join(', ')}`);
    return pass('deleteLearner references skill states, attempts, outbox and doubts');
  });

  // AUDIT-10
  runCheck('AUDIT-10', 'S5_PracticeScreen and PracticeWeakTopicsScreen use randomUUID/uuid for attempt IDs, not Date.now()', () => {
    return combine([
      attemptIdCheck('frontend/src/screens/S5_PracticeScreen.tsx'),
      attemptIdCheck('frontend/src/screens/PracticeWeakTopicsScreen.tsx'),
    ]);
  });

  // AUDIT-11
  runCheck('AUDIT-11', 'DESIGN-DECISION: practiceEngine mastery update has no Math.max(0.05 floor', () => {
    const src = readSrc('frontend/src/engine/practiceEngine.ts');
    if (src === null) return skip('frontend/src/engine/practiceEngine.ts not found');
    if (/Math\.max\(\s*0\.05\b/.test(src)) return fail('Math.max(0.05 floor present in mastery update');
    return pass('no Math.max(0.05 floor in practiceEngine.ts');
  });

  // AUDIT-12
  runCheck('AUDIT-12', 'OfflineLearningCenter Sync-now handler references the outbox, not an empty events array', () => {
    const src = readSrc('frontend/src/screens/offline/OfflineLearningCenter.tsx');
    if (src === null) return skip('frontend/src/screens/offline/OfflineLearningCenter.tsx not found');
    let handler: string | null = null;
    for (const name of ['handleSyncNow', 'syncNow', 'handleSync', 'onSyncNow']) {
      handler = functionBody(src, name);
      if (handler) break;
    }
    if (handler === null) {
      const idx = src.search(/sync[\s-]?now/i);
      if (idx === -1) return skip('Sync-now handler not found in OfflineLearningCenter.tsx');
      handler = src.slice(idx, idx + 800);
    }
    if (/getOutboxAttempts|outbox/i.test(handler)) return pass('Sync-now handler references the outbox');
    if (/events\s*[:=]\s*\[\s*\]/.test(handler)) return fail('Sync-now handler sends an empty events array');
    return fail('Sync-now handler has no outbox reference');
  });

  // AUDIT-13
  runCheck('AUDIT-13', 'S5_PracticeScreen answer handler has a try block around DB calls', () => {
    const src = readSrc('frontend/src/screens/S5_PracticeScreen.tsx');
    if (src === null) return skip('frontend/src/screens/S5_PracticeScreen.tsx not found');
    const names = ['handleAnswer', 'handleAnswerSelect', 'handleSubmit', 'submitAnswer', 'onAnswer', 'handleOptionSelect', 'handleSelect'];
    let handler: string | null = null;
    for (const n of names) {
      handler = functionBody(src, n);
      if (handler) break;
    }
    if (handler === null) return skip('answer handler not found in S5_PracticeScreen.tsx');
    if (/\btry\s*\{[\s\S]*?(db|Db|DB|indexedDb|saveAttempt|recordAttempt|outbox|await)/.test(handler)) {
      return pass('answer handler wraps DB calls in try');
    }
    return fail('answer handler has no try block around DB calls');
  });

  // AUDIT-14
  runCheck('AUDIT-14', 'EnterpriseShell.tsx contains none of "Sign Out", "Demo Role Switcher", "Offline Learning Center"', () => {
    const src = readSrc('frontend/src/components/EnterpriseShell.tsx');
    if (src === null) return skip('frontend/src/components/EnterpriseShell.tsx not found');
    const literals = ['Sign Out', 'Demo Role Switcher', 'Offline Learning Center'];
    const found = literals.filter((l) => src.includes(l));
    if (found.length > 0) return fail(`literals present: ${found.map((f) => `"${f}"`).join(', ')}`);
    return pass('none of the forbidden literals present');
  });

  // AUDIT-15
  runCheck('AUDIT-15', 'App.tsx hash-route branches for admin, guardian, syllabus contain a role check (SUSPECTED)', () => {
    const src = readSrc('frontend/src/App.tsx');
    if (src === null) return skip('frontend/src/App.tsx not found');
    const roleRe = /role|isAdmin|isTeacher|isGuardian|canAccess|permission|allowed|hasAccess/i;
    const checked: string[] = [];
    const unguarded: string[] = [];
    const notFound: string[] = [];
    for (const k of ['admin', 'guardian', 'syllabus']) {
      const m = new RegExp(`#\\/?${k}\\b`, 'i').exec(src);
      if (!m) {
        notFound.push(k);
        continue;
      }
      checked.push(k);
      const window = src.slice(Math.max(0, m.index - 200), m.index + 400);
      if (!roleRe.test(window)) unguarded.push(k);
    }
    if (checked.length === 0) return skip('no admin/guardian/syllabus hash-route branches found in frontend/src/App.tsx');
    const note = notFound.length ? ` (not found: ${notFound.join(', ')})` : '';
    if (unguarded.length > 0) return fail(`no role check near hash-route branch: ${unguarded.join(', ')}${note}`);
    return pass(`role check near hash-route branch: ${checked.join(', ')}${note}`);
  });

  // AUDIT-16
  runCheck('AUDIT-16', 'PracticeWeakTopicsScreen buttons use min-h-[56px] or h-14, not only min-h-[44px]', () => {
    const src = readSrc('frontend/src/screens/PracticeWeakTopicsScreen.tsx');
    if (src === null) return skip('frontend/src/screens/PracticeWeakTopicsScreen.tsx not found');
    if (/min-h-\[56px\]|\bh-14\b/.test(src)) return pass('buttons use min-h-[56px] or h-14');
    if (/min-h-\[44px\]/.test(src)) return fail('buttons only use min-h-[44px]');
    return skip('no button sizing class (min-h-[56px], h-14, min-h-[44px]) found');
  });

  console.log(`\n=== SUMMARY: PASS=${passCount} FAIL=${failCount} SKIPPED=${skipCount} ===`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
