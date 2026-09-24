const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('admin.html', 'utf8');
const $ = cheerio.load(html);

const script = $('script').eq(6).html(); // the main script
const lines = script.split('\n');

let depth = 0;
let lastFuncLine = 0;
let funcStack = [];

for(let i=0; i<lines.length; i++) {
    const l = lines[i];
    const opens = (l.match(/\{/g) || []).length;
    const closes = (l.match(/\}/g) || []).length;
    
    if (l.includes('function ') && !l.includes('//')) {
        funcStack.push({name: l.trim(), line: i, depth: depth});
    }
    
    depth += opens;
    depth -= closes;
    
    if (depth < 0) {
        console.log(`Warning: Negative depth at line ${i}: ${l}`);
    }
    
    while (funcStack.length > 0 && funcStack[funcStack.length-1].depth >= depth && closes > 0) {
        // If depth drops below the function's starting depth, it means it closed
        // Wait, depth AFTER the opening brace is funcStack.depth + 1 (usually)
        if (depth === funcStack[funcStack.length-1].depth) {
            funcStack.pop();
        } else {
            break;
        }
    }
}

console.log(`Final depth: ${depth}`);
if (funcStack.length > 0) {
    console.log("Unclosed functions/blocks:");
    funcStack.forEach(f => console.log(`Line ${f.line}: ${f.name}`));
}
