// Generate a 10,000-line test markdown file for scroll sync testing
import fs from 'fs';

const lines = [];

// Add headings and content
const chapters = 50;
const sectionsPerChapter = 10;
const paragraphsPerSection = 20;

for (let c = 1; c <= chapters; c++) {
    lines.push(`# Chapter ${c}\n`);
    lines.push(`This is chapter ${c} of the test document.\n`);

    for (let s = 1; s <= sectionsPerChapter; s++) {
        lines.push(`## Section ${c}.${s}\n`);
        lines.push(`This is section ${c}.${s}.\n`);

        for (let p = 1; p <= paragraphsPerSection; p++) {
            lines.push(`### Paragraph ${c}.${s}.${p}\n`);
            lines.push(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n`);

            // Add a code block every 5 paragraphs
            if (p % 5 === 0) {
                lines.push('```javascript\n');
                lines.push(`function test${c}_${s}_${p}() {\n`);
                lines.push(`    console.log("Chapter ${c}, Section ${s}, Para ${p}");\n`);
                lines.push(`    return ${c * s * p};\n`);
                lines.push('}\n');
                lines.push('```\n\n');
            }

            // Add a list every 3 paragraphs
            if (p % 3 === 0) {
                lines.push('- List item A\n');
                lines.push('- List item B\n');
                lines.push('- List item C\n\n');
            }

            // Add a blockquote every 7 paragraphs
            if (p % 7 === 0) {
                lines.push('> This is a blockquote for testing scroll sync.\n');
                lines.push('> It should be anchored properly.\n\n');
            }
        }
    }
}

const content = lines.join('');
fs.writeFileSync('test-10000-lines.md', content);
console.log(`Generated ${content.split('\n').length} lines`);
