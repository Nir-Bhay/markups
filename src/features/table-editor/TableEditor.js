export class TableEditor {
    constructor(editor, range, text, onUpdate, onClose) {
        this.editor = editor;
        this.range = range;
        this.originalText = text;
        this.onUpdate = onUpdate;
        this.onClose = onClose;

        this.tableData = this.parseMarkdownTable(text);

        this.domNode = document.createElement('div');
        this.domNode.className = 'table-editor-overlay';
        this.domNode.dataset.theme = document.documentElement.getAttribute('data-theme') || 'light';

        this.render();
    }

    parseMarkdownTable(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return { headers: [], rows: [] };

        const parseRow = (line) => line.split('|').slice(1, -1).map(c => c.trim());

        const headers = parseRow(lines[0]);
        const alignments = parseRow(lines[1]).map(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
            if (cell.endsWith(':')) return 'right';
            if (cell.startsWith(':')) return 'left';
            return 'left';
        });

        const rows = lines.slice(2).map(parseRow);

        return { headers, alignments, rows };
    }

    serializeMarkdownTable() {
        const { headers, alignments, rows } = this.tableData;

        // Auto-format widths
        const colWidths = headers.map((h, i) => {
            let max = h.length;
            rows.forEach(r => {
                if (r[i] && r[i].length > max) max = r[i].length;
            });
            return Math.max(max, 3);
        });

        const padCell = (text, index) => {
            const width = colWidths[index];
            const t = text || '';
            const align = alignments[index] || 'left';

            if (align === 'right') return ' ' + t.padStart(width, ' ') + ' ';
            if (align === 'center') {
                const totalPad = width - t.length;
                const leftPad = Math.floor(totalPad / 2);
                const rightPad = totalPad - leftPad;
                return ' ' + ' '.repeat(leftPad) + t + ' '.repeat(rightPad) + ' ';
            }
            return ' ' + t.padEnd(width, ' ') + ' ';
        };

        const renderRow = (row) => '|' + row.map((c, i) => padCell(c, i)).join('|') + '|';

        let md = renderRow(headers) + '\n';

        md += '|' + colWidths.map((w, i) => {
            const align = alignments[i] || 'left';
            if (align === 'center') return ':' + '-'.repeat(w) + ':';
            if (align === 'right') return '-'.repeat(w + 1) + ':';
            return '-'.repeat(w + 2); // left default
        }).join('|') + '|\n';

        md += rows.map(r => renderRow(r)).join('\n');

        return md;
    }

    render() {
        this.domNode.innerHTML = '';
        const { headers, rows } = this.tableData;

        // Controls
        const controls = document.createElement('div');
        controls.className = 'table-editor-controls';

        const addRowBtn = document.createElement('button');
        addRowBtn.className = 'table-editor-btn';
        addRowBtn.textContent = '+ Add Row';
        addRowBtn.onclick = () => this.addRow();

        const addColBtn = document.createElement('button');
        addColBtn.className = 'table-editor-btn';
        addColBtn.textContent = '+ Add Col';
        addColBtn.onclick = () => this.addColumn();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'table-editor-btn';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => this.onClose();

        controls.appendChild(addColBtn);
        controls.appendChild(addRowBtn);
        controls.appendChild(closeBtn);
        this.domNode.appendChild(controls);

        // Grid
        const grid = document.createElement('div');
        grid.className = 'table-editor-grid';

        // Header
        const headerRow = document.createElement('div');
        headerRow.className = 'table-editor-row';
        headers.forEach((h, i) => {
            const cell = this.createCell(h, true, i, -1);
            headerRow.appendChild(cell);
        });
        grid.appendChild(headerRow);

        // Rows
        rows.forEach((row, rowIndex) => {
            const r = document.createElement('div');
            r.className = 'table-editor-row';
            row.forEach((c, colIndex) => {
                const cell = this.createCell(c, false, colIndex, rowIndex);
                r.appendChild(cell);
            });
            grid.appendChild(r);
        });

        this.domNode.appendChild(grid);
    }

    createCell(value, isHeader, colIndex, rowIndex) {
        const cell = document.createElement('div');
        cell.className = 'table-editor-cell' + (isHeader ? ' table-editor-header-cell' : '');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';

        input.onchange = (e) => {
            if (isHeader) {
                this.tableData.headers[colIndex] = e.target.value;
            } else {
                this.tableData.rows[rowIndex][colIndex] = e.target.value;
            }
            this.notifyUpdate();
        };

        // Context menu for operations
        input.oncontextmenu = (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY, colIndex, rowIndex);
        };

        cell.appendChild(input);
        return cell;
    }

    addRow() {
        const newRow = Array(this.tableData.headers.length).fill('');
        this.tableData.rows.push(newRow);
        this.render();
        this.notifyUpdate();
    }

    addColumn() {
        this.tableData.headers.push('New Col');
        this.tableData.alignments.push('left');
        this.tableData.rows.forEach(r => r.push(''));
        this.render();
        this.notifyUpdate();
    }

    deleteRow(rowIndex) {
        if (rowIndex < 0) return; // Can't delete header easily here
        this.tableData.rows.splice(rowIndex, 1);
        this.render();
        this.notifyUpdate();
    }

    deleteColumn(colIndex) {
        this.tableData.headers.splice(colIndex, 1);
        this.tableData.alignments.splice(colIndex, 1);
        this.tableData.rows.forEach(r => r.splice(colIndex, 1));
        this.render();
        this.notifyUpdate();
    }

    setAlignment(colIndex, alignment) {
        this.tableData.alignments[colIndex] = alignment;
        this.notifyUpdate();
    }

    showContextMenu(x, y, colIndex, rowIndex) {
        this.closeContextMenu();

        const menu = document.createElement('ul');
        menu.className = 'table-editor-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const addItem = (text, onClick) => {
            const li = document.createElement('li');
            li.textContent = text;
            li.onclick = () => {
                onClick();
                this.closeContextMenu();
            };
            menu.appendChild(li);
        };

        addItem('Align Left', () => this.setAlignment(colIndex, 'left'));
        addItem('Align Center', () => this.setAlignment(colIndex, 'center'));
        addItem('Align Right', () => this.setAlignment(colIndex, 'right'));

        if (rowIndex >= 0) {
            addItem('Delete Row', () => this.deleteRow(rowIndex));
        }
        addItem('Delete Column', () => this.deleteColumn(colIndex));

        document.body.appendChild(menu);
        this.activeContextMenu = menu;

        const closeFn = (e) => {
            if (!menu.contains(e.target)) {
                this.closeContextMenu();
                document.removeEventListener('click', closeFn);
            }
        };
        setTimeout(() => document.addEventListener('click', closeFn), 10);
    }

    closeContextMenu() {
        if (this.activeContextMenu) {
            this.activeContextMenu.remove();
            this.activeContextMenu = null;
        }
    }

    notifyUpdate() {
        const md = this.serializeMarkdownTable();
        this.onUpdate(md);
    }

    getDomNode() {
        return this.domNode;
    }
}
