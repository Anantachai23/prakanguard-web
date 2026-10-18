/**
 * PrakanGuard Automated Security & Full-Stack Integrity Audit Suite
 * Run via: node scripts/audit_security.js
 */

import fs from 'fs';
import path from 'path';
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
  'src/views',
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
} catch (e) {
  assertCheck('Read admin server code', false, e.message);
}

// 5. Automated Health API Check
console.log('\n--- 5. SYSTEM HEALTH CHECK APIS ---');
assertCheck('Serverless Health API (/api/health.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/health.js')));
assertCheck('Official Flood Sync API (/api/official-flood.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/official-flood.js')));
assertCheck('Real-Time Sync API (/api/sync.js) exists', fs.existsSync(path.join(ROOT_DIR, 'api/sync.js')));

// Summary
console.log('\n================================================================');
console.log(`AUDIT RESULT: ${passedTests}/${totalTests} CHECKS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
if (passedTests === totalTests) {
  console.log('🏆 STATUS: ALL SECURITY & ARCHITECTURAL CHECKS PASSED PERFECTLY!');
} else {
  console.warn('⚠️ STATUS: SOME CHECKS REQUIRE ATTENTION.');
}
console.log('================================================================\n');
