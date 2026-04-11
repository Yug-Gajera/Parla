const fs = require('fs');
const path = require('path');

const exts = ['.tsx', '.ts'];
const skipDirs = ['node_modules', '.git', '.next', 'tmp'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!skipDirs.some(skip => file.includes(skip))) {
        results = results.concat(walk(file));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = walk(path.join(__dirname, '..', 'app')).concat(walk(path.join(__dirname, '..', 'components')), walk(path.join(__dirname, '..', 'landing')));

const jsxTextRegex = />([^<>{]+)</g;
const attrRegex = /(placeholder|title|label|description|errorMessage)={?["']([^"']+)["']}?/gi;
const toastRegex = /toast\(\s*{\s*title:\s*["']([^"']+)["'](.*?description:\s*["']([^"']+)["'])?/gi;

let extracted = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  
  // Extract simple JSX Text
  while ((match = jsxTextRegex.exec(content)) !== null) {
      let text = match[1].trim();
      // Remove lines that are just symbols or single chars
      if (text.length > 2 && /[a-zA-Z]/.test(text) && !text.includes('import ') && !text.includes('export ')) {
          extracted.push({ file: path.basename(file), type: 'jsxText', text: text });
      }
  }

  // Extract from attributes
  while ((match = attrRegex.exec(content)) !== null) {
      extracted.push({ file: path.basename(file), type: 'attribute', text: match[2].trim() });
  }

  // Extract from toasts
  while ((match = toastRegex.exec(content)) !== null) {
      extracted.push({ file: path.basename(file), type: 'toast_title', text: match[1].trim() });
      if (match[3]) {
          extracted.push({ file: path.basename(file), type: 'toast_desc', text: match[3].trim() });
      }
  }
});

let output = '';
extracted.forEach(item => {
    if (item.text && item.text.length > 3) {
      output += `[${item.file}] ${item.text}\n`;
    }
});

fs.writeFileSync(path.join(__dirname, 'texts.txt'), output);
console.log('Done extracting to tmp/texts.txt');
