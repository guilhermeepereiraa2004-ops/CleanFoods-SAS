const fs = require('fs');
const cheerio = require('cheerio');
const acorn = require('acorn');

const html = fs.readFileSync('admin.html', 'utf8');
const $ = cheerio.load(html, { sourceCodeLocationInfo: true });

$('script').each((i, el) => {
    const code = $(el).html();
    if (code && code.trim().length > 0) {
        try {
            acorn.parse(code, { ecmaVersion: 'latest' });
            console.log(`Script ${i} is valid.`);
        } catch (e) {
            console.log(`Syntax error in script ${i} at pos ${e.pos} (line ${e.loc?.line}): ${e.message}`);
            // Show the last few lines of this script
            const lines = code.split('\n');
            const start = Math.max(0, lines.length - 10);
            console.log("End of script snippet:");
            console.log(lines.slice(start).join('\n'));
        }
    }
});
