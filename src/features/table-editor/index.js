import * as monaco from 'monaco-editor';
import { TableEditor } from './TableEditor.js';

export class TableEditorManager {
    constructor() {
        this.editor = null;
        this.activeWidget = null;
        this.initialized = false;
        this.disposables = [];
        this.decorations = [];
    }

    initialize(options = {}) {
        if (this.initialized) return;
        this.editor = options.editor;
        if (!this.editor) return;

        // Add context menu action to open table editor
        this.disposables.push(
            this.editor.addAction({
                id: 'edit-markdown-table',
                label: 'Edit Table (Notion-style)',
                contextMenuGroupId: 'navigation',
                contextMenuOrder: 1.5,
                run: () => this.openTableEditorAtCursor()
            })
        );

        this.initialized = true;
    }

    openTableEditorAtCursor() {
        const position = this.editor.getPosition();
        const model = this.editor.getModel();

        // Find table bounds around cursor
        let startLine = position.lineNumber;
        if (!model.getLineContent(startLine).trim().startsWith('|')) { console.warn('Not a table'); return; }
        let endLine = position.lineNumber;

        while (startLine > 1 && model.getLineContent(startLine - 1).trim().startsWith('|')) {
            startLine--;
        }

        while (endLine < model.getLineCount() && model.getLineContent(endLine + 1).trim().startsWith('|')) {
            endLine++;
        }

        const tableText = [];
        for (let i = startLine; i <= endLine; i++) {
            tableText.push(model.getLineContent(i));
        }

        const isTable = tableText.length >= 2 && tableText[0].trim().startsWith('|');
        if (!isTable) {
            console.warn('No markdown table found at cursor.');
            return;
        }

        const text = tableText.join('\n');

        // Hide underlying text via decoration
        this.decorations = this.editor.deltaDecorations(this.decorations, [
            {
                range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
                options: {
                    inlineClassName: 'table-editor-hidden-text'
                }
            }
        ]);

        this.showWidget(startLine, endLine, text);
    }

    showWidget(startLine, endLine, text) {
        this.closeWidget();

        const range = new monaco.Range(
            startLine, 1, endLine, this.editor.getModel().getLineMaxColumn(endLine)
        );

        const onUpdate = (newText) => {
            this.editor.executeEdits('table-editor', [{
                range: this.activeWidget.range,
                text: newText,
                forceMoveMarkers: true
            }]);

            // Adjust endLine based on new line count
            const newLines = newText.split('\n').length;
            this.activeWidget.range = new monaco.Range(
                startLine, 1, startLine + newLines - 1, this.editor.getModel().getLineMaxColumn(startLine + newLines - 1)
            );
        };

        const onClose = () => {
            this.closeWidget();
        };

        const tableEditor = new TableEditor(this.editor, range, text, onUpdate, onClose);

        this.activeWidget = {
            range: range,
            getId: () => 'table.editor.widget',
            getDomNode: () => tableEditor.getDomNode(),
            getPosition: () => {
                return {
                    position: { lineNumber: startLine, column: 1 },
                    preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
                };
            }
        };

        this.editor.addContentWidget(this.activeWidget);
    }

    closeWidget() {
        if (this.activeWidget) {
            this.editor.removeContentWidget(this.activeWidget);
            this.activeWidget = null;

            // Remove hidden text decoration
            this.decorations = this.editor.deltaDecorations(this.decorations, []);
        }
    }

    destroy() {
        this.closeWidget();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.initialized = false;
    }
}

export const tableEditorManager = new TableEditorManager();
export default tableEditorManager;
