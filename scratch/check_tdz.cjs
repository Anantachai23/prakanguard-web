const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('src/App.jsx', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

let errors = [];

traverse(ast, {
  FunctionDeclaration(path) {
    if (path.node.id && path.node.id.name === 'App') {
      checkFunctionScope(path);
    }
  }
});

function checkFunctionScope(funcPath) {
  const declarations = new Map(); // name -> { line, kind }

  funcPath.get('body').get('body').forEach(stmtPath => {
    const line = stmtPath.node.loc.start.line;
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
    } else if (stmtPath.isFunctionDeclaration()) {
      declarations.set(stmtPath.node.id.name, { line, kind: 'function' });
    }
  });

  console.log(`Found ${declarations.size} top-level declarations in App`);

  funcPath.get('body').get('body').forEach(stmtPath => {
    const stmtLine = stmtPath.node.loc.start.line;

    // 1. Direct synchronous execution in stmt (excluding inside function bodies that are callbacks, unless immediately invoked or useMemo)
    stmtPath.traverse({
      // Hook calls
      CallExpression(callPath) {
        const callee = callPath.node.callee;
        const calleeName = callee.type === 'Identifier' ? callee.name : null;

        if (['useEffect', 'useMemo', 'useCallback'].includes(calleeName)) {
          // Check dependency array
          const depsArg = callPath.node.arguments[1];
          if (depsArg && depsArg.type === 'ArrayExpression') {
            depsArg.elements.forEach(el => {
              if (el && el.type === 'Identifier') {
                const decl = declarations.get(el.name);
                if (decl && (decl.kind === 'const' || decl.kind === 'let') && decl.line > stmtLine) {
                  errors.push({
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

          if (calleeName === 'useMemo') {
            callPath.get('arguments.0').traverse({
              Identifier(idPath) {
                if (idPath.isReferencedIdentifier()) {
                  const decl = declarations.get(idPath.node.name);
                  if (decl && (decl.kind === 'const' || decl.kind === 'let') && decl.line > stmtLine) {
                    errors.push({
                      type: 'TDZ in Synchronous useMemo Body',
                      identifier: idPath.node.name,
                      usedAtLine: idPath.node.loc.start.line,
                      declaredAtLine: decl.line,
                      hook: calleeName
                    });
                  }
                }
              }
            });
          }
        }
      },
      // Check any direct identifier reference not nested inside a function
      Identifier(idPath) {
        if (!idPath.isReferencedIdentifier()) return;
        
        // Check if inside a function (callback) or in top-level expression of stmt
        let parentFunc = idPath.getFunctionParent();
        if (parentFunc === funcPath) {
          // It is directly executed at render time in the statement!
          const decl = declarations.get(idPath.node.name);
          if (decl && (decl.kind === 'const' || decl.kind === 'let') && decl.line > stmtLine) {
            errors.push({
              type: 'TDZ in Render Statement',
              identifier: idPath.node.name,
              usedAtLine: idPath.node.loc.start.line,
              declaredAtLine: decl.line,
              hook: 'top-level'
            });
          }
        }
      }
    });
  });
}

console.log(`Scan completed. Found ${errors.length} TDZ error(s):`);
errors.forEach(e => {
  console.log(`- [${e.type}] '${e.identifier}' used at line ${e.usedAtLine} before declaration at line ${e.declaredAtLine} in ${e.hook}`);
});
