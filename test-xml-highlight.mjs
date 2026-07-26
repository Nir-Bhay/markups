import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';

const code = '<Sid Name="test" Flag="1" />';
const langs = ['xml', 'XML', 'Xml', 'html', 'svg'];

for (const lang of langs) {
  const key = String(lang).trim().toLowerCase();
  const grammar = Prism.languages[key] || Prism.languages.xml;
  const out = grammar ? Prism.highlight(code, grammar, key) : code;
  console.log(lang, '=>', out.includes('token') ? 'HIGHLIGHTED' : 'plain');
  if (lang === 'xml') console.log(' sample:', out.slice(0, 120));
}
