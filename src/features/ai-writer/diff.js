/**
 * Small dependency-free line diff for the AI preview.
 * It intentionally favors predictable output over a minimal edit script.
 */

export function createLineDiff(before, after) {
    const oldLines = String(before || '').split('\n');
    const newLines = String(after || '').split('\n');

    if (oldLines.length > 400 || newLines.length > 400) {
        return [
            ...oldLines.map((text) => ({ type: 'removed', text })),
            ...newLines.map((text) => ({ type: 'added', text }))
        ];
    }

    const table = Array.from({ length: oldLines.length + 1 }, () =>
        new Array(newLines.length + 1).fill(0)
    );

    for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
        for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
            table[oldIndex][newIndex] = oldLines[oldIndex] === newLines[newIndex]
                ? table[oldIndex + 1][newIndex + 1] + 1
                : Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
        }
    }

    const diff = [];
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex < oldLines.length && newIndex < newLines.length) {
        if (oldLines[oldIndex] === newLines[newIndex]) {
            diff.push({ type: 'same', text: oldLines[oldIndex] });
            oldIndex += 1;
            newIndex += 1;
        } else if (table[oldIndex + 1][newIndex] >= table[oldIndex][newIndex + 1]) {
            diff.push({ type: 'removed', text: oldLines[oldIndex] });
            oldIndex += 1;
        } else {
            diff.push({ type: 'added', text: newLines[newIndex] });
            newIndex += 1;
        }
    }
    while (oldIndex < oldLines.length) {
        diff.push({ type: 'removed', text: oldLines[oldIndex++] });
    }
    while (newIndex < newLines.length) {
        diff.push({ type: 'added', text: newLines[newIndex++] });
    }
    return diff;
}

export function renderLineDiffHtml(before, after) {
    const escape = (value) => {
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML || '&nbsp;';
    };

    return createLineDiff(before, after)
        .map(({ type, text }) => {
            const prefix = type === 'removed' ? '−' : type === 'added' ? '+' : ' ';
            return `<div class="ai-diff-line ai-diff-${type}"><span class="ai-diff-prefix">${prefix}</span>${escape(text)}</div>`;
        })
        .join('');
}
