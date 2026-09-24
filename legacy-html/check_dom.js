const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('admin.html', 'utf8');
const $ = cheerio.load(html, { sourceCodeLocationInfo: true });

console.log('Main parent:', $('main').parent().get(0).tagName);
console.log('tab-clientes parent:', $('#tab-clientes').parent().get(0).tagName);

$('#tab-clientes').parents().each((i, el) => {
    console.log(`Ancestor ${i}:`, el.tagName, el.attribs.id, el.attribs.class);
});
