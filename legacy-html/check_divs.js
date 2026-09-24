const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const lines = html.split('\n');

let divCount = 0;
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    
    // Count <div and </div tags. (Simple regex, assumes well-formed tags on single lines mostly, good enough for a rough check)
    const openDivs = (l.match(/<div(\s|>)/g) || []).length;
    const closeDivs = (l.match(/<\/div>/g) || []).length;
    
    divCount += openDivs - closeDivs;
    
    if (l.includes('id="tab-')) {
        console.log(`Line ${i + 1}: ${l.trim()} | Current Div Depth: ${divCount}`);
    }
    
    // Optionally log if it drops below a baseline (say, 0)
    // if (divCount < 0) console.log(`Negative depth at line ${i+1}`);
}
console.log(`Final div depth: ${divCount}`);
