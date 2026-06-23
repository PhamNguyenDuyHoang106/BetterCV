const fs = require('fs');

const content = fs.readFileSync('apps/web/hooks/cv/useAiRewrite.ts', 'utf8');
const lines = content.split('\n');

let depth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let lineOpen = 0;
  let lineClose = 0;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      depth++;
      lineOpen++;
    } else if (char === '}') {
      depth--;
      lineClose++;
    }
  }
  if (lineOpen > 0 || lineClose > 0) {
    console.log(`Line ${String(i + 1).padStart(3)} | Depth: ${depth} | +${lineOpen} -${lineClose} | ${line.trim()}`);
  }
}
