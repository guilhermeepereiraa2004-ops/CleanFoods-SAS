const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const lines = html.split('\n');

let depth = 0;
for(let i=0; i<lines.length; i++) {
    const l = lines[i];
    // Find all <div> and </div> matches
    const opens = (l.match(/<div(\s|>)/g) || []).length;
    const closes = (l.match(/<\/div>/g) || []).length;
    
    if (opens > 0 || closes > 0) {
        depth += (opens - closes);
        console.log(`Line ${i+1}: +${opens} -${closes} | Depth: ${depth} | ${l.trim().substring(0, 50)}`);
    }
}
