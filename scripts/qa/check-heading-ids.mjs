import { createHeadingIdAllocator, slugifyHeading } from '../../src/utils/heading-ids.js';

const alloc = createHeadingIdAllocator();
const ids = ['Repeated', 'Repeated', 'Repeated'].map((t) => alloc(t));
const expected = ['repeated', 'repeated-1', 'repeated-2'];

if (ids.join(',') !== expected.join(',')) {
    console.error('FAIL', ids, 'expected', expected);
    process.exit(1);
}
if (slugifyHeading('Hello World!') !== 'hello-world') {
    console.error('FAIL slugify');
    process.exit(1);
}
console.log('heading id uniquify passed');
