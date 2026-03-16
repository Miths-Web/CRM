const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = "c:\\Users\\mithl\\.gemini\\antigravity\\scratch\\Advanced_CRM_System\\frontend\\src\\app\\features";

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /<lucide-icon \[img\]="[^"]+" class="inline-icon"><\/lucide-icon>\s*/g;
    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
