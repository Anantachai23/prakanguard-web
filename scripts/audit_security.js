/**
 * PrakanGuard Automated Security & Full-Stack Integrity Audit Suite
 * Run via: node scripts/audit_security.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🛡️  PRAKANGUARD AUTOMATED SECURITY & SYSTEM INTEGRITY AUDIT');
console.log('================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Root Directory: ${ROOT_DIR}\n`);

let passedTests = 0;
let totalTests = 0;

function assertCheck(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
    if (details) console.log(`     ↳ ${details}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    if (details) console.error(`     ↳ Error: ${details}`);
  }
}

// 1. Directory Structure Integrity
console.log('\n--- 1. FULL-STACK DIRECTORY STRUCTURE ---');
const requiredDirs = [
  'src',
  'src/components',
  'src/data',
  'src/services',
  'admin',
  'admin/server',
  'admin/assets',
  'api',
  'public',
  'docs',
  '.vscode'
];
requiredDirs.forEach(dir => {
  const fullPath = path.join(ROOT_DIR, dir);
  assertCheck(`Directory '${dir}' exists`, fs.existsSync(fullPath));
});

// 2. VS Code Architecture Files
console.log('\n--- 2. VS CODE REVIEW ARCHITECTURE ---');
const vscodeFiles = [
  '.vscode/settings.json',
  '.vscode/extensions.json',
  '.vscode/launch.json',
  '.vscode/tasks.json'
];
vscodeFiles.forEach(file => {
  const fullPath = path.join(ROOT_DIR, file);
  assertCheck(`VS Code config '${file}' exists`, fs.existsSync(fullPath));
});

// 3. Security Headers in vercel.json
console.log('\n--- 3. CLOUD DEPLOYMENT SECURITY HEADERS ---');
try {
  const vercelJsonPath = path.join(ROOT_DIR, 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  const allRouteHeader = vercelConfig.headers.find(h => h.source === '/(.*)');
  
  assertCheck('Global route header block exists', !!allRouteHeader);
  if (allRouteHeader) {
    const headerKeys = allRouteHeader.headers.map(h => h.key);
    assertCheck('Header X-Content-Type-Options: nosniff present', headerKeys.includes('X-Content-Type-Options'));
    assertCheck('Header X-Frame-Options present', headerKeys.includes('X-Frame-Options'));
    assertCheck('Header X-XSS-Protection present', headerKeys.includes('X-XSS-Protection'));
    assertCheck('Header Referrer-Policy present', headerKeys.includes('Referrer-Policy'));
    assertCheck('Header Permissions-Policy present', headerKeys.includes('Permissions-Policy'));
    assertCheck('Header Strict-Transport-Security (HSTS) present', headerKeys.includes('Strict-Transport-Security'));
    assertCheck('Header Cross-Origin-Opener-Policy present', headerKeys.includes('Cross-Origin-Opener-Policy'));
  }
} catch (e) {
  assertCheck('Read vercel.json headers', false, e.message);
}

// 4. Admin Backend Server Security Audit
console.log('\n--- 4. ADMIN BACKEND HARDENED SECURITY ---');
try {
  const adminAppPath = path.join(ROOT_DIR, 'admin/server/app.js');
  const adminAppCode = fs.readFileSync(adminAppPath, 'utf8');

  assertCheck('Admin server has rate-limiting mechanism', adminAppCode.includes('checkRateLimit'));
  assertCheck('Admin server sets X-Content-Type-Options', adminAppCode.includes("res.setHeader('X-Content-Type-Options', 'nosniff')"));
  assertCheck('Admin server sets X-Frame-Options', adminAppCode.includes("res.setHeader('X-Frame-Options', 'SAMEORIGIN')"));
  assertCheck('Admin server has /api/health endpoint', adminAppCode.includes("pathname === '/api/health'"));
  assertCheck('Directory traversal prevention exists', adminAppCode.includes('!filePath.startsWith(ADMIN_DIR)'));
  assertCheck('Admin server blocks static serving of /data/ and /server/', adminAppCode.includes("normPath.startsWith('/data/')") && adminAppCode.includes("normPath.startsWith('/server/')"));
  assertCheck('Admin server binds to loopback 127.0.0.1 by default', adminAppCode.includes("'127.0.0.1'"));
} catch (e) {
  assertCheck('Read admin server code', false, e.message);
}

// 5. Automated Health API Check
console.log('\n--- 5. SYSTEM HEALTH CHECK APIS ---');
assertCheck('Serverless Health API (/api/health.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/health.js')));
assertCheck('Official Flood Sync API (/api/official-flood.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/official-flood.js')));
assertCheck('Real-Time Sync API (/api/sync.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/sync.js')));

// 6. Zero Secret, Personal IP & Bundle Data Leak Verification
console.log('\n--- 6. PRIVACY, SECRET & BUILD BUNDLE PROTECTION ---');
try {
  const dashCode = fs.readFileSync(path.join(ROOT_DIR, 'admin/assets/js/dashboard.js'), 'utf8');
  const cloudSyncCode = fs.readFileSync(path.join(ROOT_DIR, 'src/services/cloudSyncService.js'), 'utf8');
  const viteConfigCode = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.js'), 'utf8');

  assertCheck('No hardcoded personal IP address in admin dashboard', !dashCode.includes('171.96.89.22'));
  assertCheck('Map popup photo URL is sanitized with safePhotoUrl()', dashCode.includes('safePhotoUrl('));
  assertCheck('Public report fetch excludes citizen phone numbers for anonymous users', cloudSyncCode.includes('REPORT_PUBLIC_SELECT_COLS') && !cloudSyncCode.match(/REPORT_PUBLIC_SELECT_COLS\s*=\s*['"][^'"]*phone/));
  assertCheck('Admin action publisher enforces session token verification', cloudSyncCode.includes('verifyAdminSessionToken()'));
  assertCheck('Vite build plugin isolates admin static assets (no data/server leak)', viteConfigCode.includes("copyDirSync(assetsSrc, resolve(dest, 'assets'))") && !fs.existsSync(path.join(ROOT_DIR, 'dist/admin/data')) && !fs.existsSync(path.join(ROOT_DIR, 'dist/admin/server')));
} catch (e) {
  assertCheck('Privacy & secret verification checks', false, e.message);
}

// 7. Git Repository Secret & Plaintext Password Leak Prevention
console.log('\n--- 7. GIT REPOSITORY SECRET & CREDENTIAL GUARD ---');
try {
  const gitignoreCode = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
  assertCheck('.gitignore blocks .env and .env.* files', gitignoreCode.includes('.env') && gitignoreCode.includes('.env.*'));
  assertCheck('.gitignore blocks private keys (*.pem, *.key, *.secret)', gitignoreCode.includes('*.pem') && gitignoreCode.includes('*.key'));
  assertCheck('.gitignore blocks local runtime admin data (admin/data/*.json)', gitignoreCode.includes('admin/data/*.json'));

  const trackedFiles = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  const trackedEnvFiles = trackedFiles.filter(f => /(^|\/)\.env(\..+)?$/i.test(f) && !f.endsWith('.env.example'));
  assertCheck('Zero .env secret files tracked in Git', trackedEnvFiles.length === 0, trackedEnvFiles.join(', '));

  const trackedKeyFiles = trackedFiles.filter(f => /\.(pem|key|p12|pfx|secret|credentials)$/i.test(f) || /^admin\/data\/.*\.json$/i.test(f));
  assertCheck('Zero private key or local admin data JSON files tracked in Git', trackedKeyFiles.length === 0, trackedKeyFiles.join(', '));

  const forbiddenPatterns = [
    { name: 'Historical plaintext password (Prakan#Guard2026!Secured*)', regex: /Prakan#Guard2026!Secured/i },
    { name: 'Supabase secret service_role key (sb_secret_*)', regex: /sb_secret_[A-Za-z0-9_-]{15,}/ },
    { name: 'Google / Gemini API key (AIzaSy*)', regex: /AIzaSy[A-Za-z0-9_-]{33}/ },
    { name: 'OpenAI secret key (sk-*)', regex: /\bsk-(proj-)?[A-Za-z0-9]{20,}/ },
    { name: 'GitHub Personal Access Token (ghp_* / github_pat_*)', regex: /\b(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/ },
    { name: 'PEM Private Key block', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: 'Old revoked Supabase project key (sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw)', regex: /sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw/ }
  ];

  const textFiles = trackedFiles.filter(f => !/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(f) && f !== 'package-lock.json' && f !== 'scripts/audit_security.js' && !f.includes('vendor/'));

  for (const pat of forbiddenPatterns) {
    const hits = [];
    for (const f of textFiles) {
      const full = path.join(ROOT_DIR, f);
      if (!fs.existsSync(full)) continue;
      const content = fs.readFileSync(full, 'utf8');
      if (pat.regex.test(content)) hits.push(f);
    }
    assertCheck(`Zero leaks of ${pat.name}`, hits.length === 0, hits.join(', '));
  }
} catch (e) {
  assertCheck('Git repository secret scan', false, e.message);
}

// Summary
console.log('\n================================================================');
console.log(`AUDIT RESULT: ${passedTests}/${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
if (passedTests === totalTests) {
  console.log('🏆 STATUS: ALL SECURITY & ARCHITECTURAL CHECKS PASSED PERFECTLY!');
} else {
  console.warn('⚠️ STATUS: SOME CHECKS REQUIRE ATTENTION.');
}
console.log('================================================================\n');
