const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allSrcFiles = getAllFiles('src');
let totalErrors = 0;

for (const file of allSrcFiles) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
    continue;
  }

  let fileErrors = [];

  function checkScope(funcPath, funcName) {
    const bodyPath = funcPath.get('body');
    if (!bodyPath || !bodyPath.isBlockStatement()) return;
    const stmts = bodyPath.get('body');
    if (!Array.isArray(stmts)) return;

    const declarations = new Map();
    stmts.forEach(stmtPath => {
      const line = stmtPath.node.loc?.start?.line || 0;
      if (stmtPath.isVariableDeclaration()) {
        const kind = stmtPath.node.kind;
        stmtPath.get('declarations').forEach(decl => {
          if (decl.node.id.type === 'Identifier') {
            declarations.set(decl.node.id.name, { line, kind });
          } else if (decl.node.id.type === 'ArrayPattern') {
            decl.node.id.elements.forEach(elem => {
              if (elem && elem.type === 'Identifier') {
                declarations.set(elem.name, { line, kind });
              }
            });
          } else if (decl.node.id.type === 'ObjectPattern') {
            decl.node.id.properties.forEach(prop => {
              if (prop && prop.value && prop.value.type === 'Identifier') {
                declarations.set(prop.value.name, { line, kind });
              }
            });
          }
        });
      } else if (stmtPath.isFunctionDeclaration() && stmtPath.node.id) {
        declarations.set(stmtPath.node.id.name, { line, kind: 'function' });
      }
    });

    stmts.forEach(stmtPath => {
      const stmtLine = stmtPath.node.loc?.start?.line || 0;
      stmtPath.traverse({
        CallExpression(callPath) {
          const callee = callPath.node.callee;
          const calleeName = callee.type === 'Identifier' ? callee.name : null;

          if (['useEffect', 'useMemo', 'useCallback'].includes(calleeName)) {
            const depsArg = callPath.node.arguments[1];
            if (depsArg && depsArg.type === 'ArrayExpression') {
              depsArg.elements.forEach(el => {
                if (el && el.type === 'Identifier') {
                  const decl = declarations.get(el.name);
                  if (decl && (decl.kind === 'const' || decl.kind === 'let') && decl.line > stmtLine) {
                    fileErrors.push({
                      file,
                      funcName,
                      type: 'TDZ in Hook Dependency',
                      identifier: el.name,
                      usedAtLine: el.loc ? el.loc.start.line : stmtLine,
                      declaredAtLine: decl.line,
                      hook: calleeName
                    });
                  }
                }
              });
            }
          }
        },
        Identifier(idPath) {
          if (!idPath.isReferencedIdentifier()) return;
          let parentFunc = idPath.getFunctionParent();
          if (parentFunc === funcPath) {
            const decl = declarations.get(idPath.node.name);
            if (decl && (decl.kind === 'const' || decl.kind === 'let') && decl.line > stmtLine) {
              fileErrors.push({
                file,
                funcName,
                type: 'TDZ in Render Statement',
                identifier: idPath.node.name,
                usedAtLine: idPath.node.loc ? idPath.node.loc.start.line : stmtLine,
                declaredAtLine: decl.line,
                hook: 'top-level'
              });
            }
          }
        }
      });
    });
  }

  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id) {
        checkScope(path, path.node.id.name);
      }
    },
    VariableDeclarator(path) {
      if (path.node.id && path.node.id.type === 'Identifier' && path.node.init &&
          (path.node.init.type === 'FunctionExpression' || path.node.init.type === 'ArrowFunctionExpression')) {
        checkScope(path.get('init'), path.node.id.name);
      }
    }
  });

  if (fileErrors.length > 0) {
    console.log(`\nFound ${fileErrors.length} errors in ${file}:`);
    fileErrors.forEach(e => {
      console.log(`  - [${e.type}] '${e.identifier}' in ${e.funcName} used at line ${e.usedAtLine} before declaration at line ${e.declaredAtLine}`);
    });
    totalErrors += fileErrors.length;
  }
}

console.log(`\nScan finished. Total errors across whole codebase: ${totalErrors}`);
