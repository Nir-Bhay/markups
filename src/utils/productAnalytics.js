/**
 * Privacy-aware, minimal GA4 activation telemetry for the hosted Markups editor.
 * Never send document content, titles, file names, API keys or share URLs.
 * GA4 is already configured in index.html; this module never loads trackers.
 */
const SESSION_KEY = 'markups_editor_started_v1';
const EXPORT_FORMATS = new Set(['pdf', 'html', 'md', 'doc', 'txt', 'png']);
let editorStartSentThisPage = false;

function emitProductEvent(name, params, context = globalThis) {
    // Only the first-party production hostname may send activation events.
    if (context?.location?.hostname !== 'markups.dev' || context.__MARKUPS_LOCAL__) return false;
    if (typeof context.gtag !== 'function') return false;
    if (name !== 'editor_start' && name !== 'export_completed') return false;
    const payload = name === 'editor_start' ? {} : { export_format: params.export_format };
    if (name === 'export_completed' && !EXPORT_FORMATS.has(payload.export_format)) return false;
    try {
        context.gtag('event', name, payload);
        return true;
    } catch {
        // Measurement must never break editing or downloads.
        return false;
    }
}

export function trackEditorStartOnce(context = globalThis) {
    if (editorStartSentThisPage) return false;
    try {
        if (context.sessionStorage?.getItem(SESSION_KEY) === '1') {
            editorStartSentThisPage = true;
            return false;
        }
    } catch { /* private browsing/storage restrictions */ }
    if (!emitProductEvent('editor_start', {}, context)) return false;
    editorStartSentThisPage = true;
    try { context.sessionStorage?.setItem(SESSION_KEY, '1'); } catch { /* optional */ }
    return true;
}

export function trackExportCompleted(format, context = globalThis) {
    return emitProductEvent('export_completed', { export_format: format }, context);
}
