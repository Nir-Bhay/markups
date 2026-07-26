// Test script to verify Prism XML import works
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';

console.log('Prism loaded:', typeof Prism !== 'undefined');
console.log('XML language available:', typeof Prism.languages.xml !== 'undefined');
console.log('Available languages:', Object.keys(Prism.languages).filter(l => l.includes('xml') || l.includes('markup')));
