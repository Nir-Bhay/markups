# Plan for Issue #18: Enhanced Interactive Tables (Notion-style UX)

This document outlines the detailed design and implementation strategy for adding enhanced, interactive Markdown tables with a Notion-style user experience.

## Goal

Provide a WYSIWYG overlay for editing Markdown tables within the editor. Features will include resizing columns, adding rows/cols via visual buttons, and a context menu for editing (e.g., delete row, align center). The content should always compile back to valid GFM (GitHub Flavored Markdown) in source mode.

## Implementation Steps

1. **Setup File Structure**:
   - Following the issue specification, the primary component will be located at: `src/features/editor/components/TableEditor.tsx`.
   - Create accompanying utility files if needed, such as `TableParser.ts` for parsing logic and CSS/SCSS modules for styles.

2. **Monaco Editor Integration**:
   - Hook into Monaco's `onDidChangeModelContent` and `onDidScrollChange`.
   - Use Monaco's `ContentWidget` API to overlay a custom React component (the `TableEditor.tsx` UI) directly over the text range containing a Markdown table.
   - When the user's cursor is inside the table range, the raw text can either be hidden (via view zones or CSS) or the table widget covers it.

3. **Parsing Module**:
   - Identify table boundaries within the Markdown document using regex or a markdown parser.
   - Parse the Markdown table into a structured JSON representation: `columns` (headers, alignment), and `rows` (cell data).

4. **WYSIWYG Overlay (`TableEditor.tsx`)**:
   - Render a DOM-based interactive table (`<div>` grid or `<table>`) over the text.
   - Implement event listeners for editing text within cells (using contenteditable or nested inputs).

5. **Interactive Controls (Notion-style UX)**:
   - **Add Buttons**: Display a floating '+' button on hover between columns or at the end of the table for adding rows/columns.
   - **Column Resizing**: Implement drag handles on column borders. This width data can be managed in CSS and loosely mapped to Markdown space padding, although GFM ignores arbitrary widths.
   - **Context Menu**: Right-click within the table cells for actions: 'Align Left/Center/Right', 'Delete Row/Col', 'Insert Row Above/Below'.
   - **Drag-to-Reorder**: Implement drag-and-drop for rows using HTML5 Drag and Drop API.

6. **Data Binding & Serialization**:
   - On every structural edit via the overlay, update the internal JSON state.
   - Re-serialize the JSON state back into a valid, aligned Markdown table string.
   - Apply the serialized string to the Monaco editor model at the exact range of the original table using `editor.executeEdits`.

7. **Additional Feature (Auto-format)**:
   - Add a global auto-formatter command that neatly aligns all columns in all Markdown tables with spaces automatically when saving.

## Success Criteria
- [ ] Visual 'Add Row/Column' buttons are present and functional.
- [ ] Column resizing via mouse drag works visually.
- [ ] Context menu actions (delete, align) are working.
- [ ] Underlying Markdown remains valid GFM in 'Source Mode'.
