/**
 * Pull spell-checkable words out of markdown, skipping fenced code,
 * inline code, and URLs.
 */

const WORD = /[A-Za-z][A-Za-z']+/g;

function maskLine(line) {
    return line
        .replace(/`[^`\n]*`/g, (match) => ' '.repeat(match.length))
        .replace(/https?:\/\/\S+/g, (match) => ' '.repeat(match.length))
        .replace(/\]\([^)\n]*\)/g, (match) => ' '.repeat(match.length));
}

export function collectSpellTargets(text) {
    const lines = String(text ?? '').split('\n');
    const targets = [];
    let inFence = false;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (/^\s*(```|~~~)/.test(raw)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;

        const line = maskLine(raw);
        WORD.lastIndex = 0;
        let match;
        while ((match = WORD.exec(line))) {
            const word = match[0].replace(/^'+|'+$/g, '');
            if (word.length < 2) continue;
            targets.push({
                word,
                line: i + 1,
                startColumn: match.index + 1,
                endColumn: match.index + 1 + match[0].length
            });
        }
    }

    return targets;
}
