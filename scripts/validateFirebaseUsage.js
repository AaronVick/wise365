// scripts/validateFirebaseUsage.js
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const PATTERNS = {
  FIREBASE_IMPORTS: /import.*firebase.*|require\(['"]firebase.*['"]\)/,
  DIRECT_FIREBASE_USAGE: /(collection|doc|query|where|orderBy|getDocs|getDoc|addDoc|updateDoc|deleteDoc)\(/,
  SERVICE_IMPORT: /import.*firebaseService.*|require\(['"].*firebaseService['"]\)/,
};

const REQUIRED_SERVICE_METHODS = [
  'queryCollection',
  'get',
  'create',
  'update',
  'delete',
  'subscribeToCollection'
];

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for direct Firebase usage
  if (PATTERNS.FIREBASE_IMPORTS.test(content) && 
      PATTERNS.DIRECT_FIREBASE_USAGE.test(content) && 
      !filePath.includes('firebaseService.js') &&
      !filePath.includes('api/')) {
    issues.push('Direct Firebase usage detected outside of firebaseService');
  }

  // Check for missing service import when Firebase is used
  if (PATTERNS.DIRECT_FIREBASE_USAGE.test(content) && 
      !PATTERNS.SERVICE_IMPORT.test(content) &&
      !filePath.includes('firebaseService.js') &&
      !filePath.includes('api/')) {
    issues.push('Firebase used without firebaseService import');
  }

  // Parse AST for deeper analysis
  try {
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    // Check for correct method usage
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (callee.object && callee.object.name === 'firebaseService') {
          if (!REQUIRED_SERVICE_METHODS.includes(callee.property.name)) {
            issues.push(`Unknown firebaseService method: ${callee.property.name}`);
          }
        }
      }
    });

  } catch (error) {
    console.log(`Warning: Could not parse ${filePath} for deep analysis`);
  }

  return issues;
}

function validateProject(dir) {
  const results = {
    issuesByFile: {},
    totalIssues: 0
  };

  function processFile(filePath) {
    const ext = path.extname(filePath);
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      const issues = validateFile(filePath);
      if (issues.length > 0) {
        results.issuesByFile[filePath] = issues;
        results.totalIssues += issues.length;
      }
    }
  }

  function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          walkDir(filePath);
        }
      } else {
        processFile(filePath);
      }
    }
  }

  walkDir(dir);
  return results;
}

// Run validation
const projectRoot = process.argv[2] || '.';
console.log('Validating Firebase usage...');
const results = validateProject(projectRoot);

if (results.totalIssues > 0) {
  console.log('\nIssues found:');
  for (const [file, issues] of Object.entries(results.issuesByFile)) {
    console.log(`\n${file}:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  process.exit(1);
} else {
  console.log('No issues found!');
  process.exit(0);
}