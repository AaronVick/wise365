// scripts/analyzeFirebaseUsage.js
const fs = require('fs');
const path = require('path');

// Patterns to look for
const PATTERNS = {
  FIREBASE_QUERY: /query\((.*?)\)/gs,
  WHERE_CLAUSE: /where\(['"](.*?)['"],\s*['"]?==['"]?,\s*(.*?)\)/g,
  USER_IDENTIFIERS: /(user\.uid|userId|authenticationID|user_id)/g,
  COLLECTION_REF: /collection\(db,\s*['"](.*?)['"]\)/g
};

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = {
    queries: [],
    collections: new Set(),
    userIdentifiers: new Set()
  };

  // Find collections
  let collectionMatch;
  while ((collectionMatch = PATTERNS.COLLECTION_REF.exec(content)) !== null) {
    findings.collections.add(collectionMatch[1]);
  }

  // Find where clauses with user identifiers
  let whereMatch;
  while ((whereMatch = PATTERNS.WHERE_CLAUSE.exec(content)) !== null) {
    const [fullMatch, field, value] = whereMatch;
    if (PATTERNS.USER_IDENTIFIERS.test(field) || PATTERNS.USER_IDENTIFIERS.test(value)) {
      findings.queries.push({
        line: getLineNumber(content, whereMatch.index),
        field,
        value: value.trim()
      });
    }
  }

  return findings;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkDir(filepath, callback);
    } else if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
      callback(filepath);
    }
  });
}

function analyzeProject(projectRoot) {
  const findings = {
    files: {},
    collections: new Set(),
    userIdentifiers: new Set()
  };

  walkDir(projectRoot, (filepath) => {
    const relPath = path.relative(projectRoot, filepath);
    const fileFindings = analyzeFile(filepath);
    
    if (fileFindings.queries.length > 0 || fileFindings.collections.size > 0) {
      findings.files[relPath] = fileFindings;
      fileFindings.collections.forEach(col => findings.collections.add(col));
    }
  });

  return findings;
}

// Generate report
function generateReport(findings) {
  let report = '# Firebase Usage Analysis\n\n';

  // Collections summary
  report += '## Collections Found\n';
  [...findings.collections].sort().forEach(col => {
    report += `- ${col}\n`;
  });

  // File analysis
  report += '\n## Files with Firebase Queries\n';
  Object.entries(findings.files).forEach(([file, fileFindings]) => {
    if (fileFindings.queries.length > 0) {
      report += `\n### ${file}\n`;
      fileFindings.queries.forEach(query => {
        report += `- Line ${query.line}: ${query.field} ${query.value}\n`;
      });
    }
  });

  return report;
}

// Main execution
const projectRoot = process.argv[2] || '.';
console.log('Analyzing project...');
const findings = analyzeProject(projectRoot);
const report = generateReport(findings);

// Save report
const reportPath = path.join(projectRoot, 'firebase-usage-report.md');
fs.writeFileSync(reportPath, report);
console.log(`Report saved to ${reportPath}`);

// Export findings for potential automated updates
module.exports = findings;