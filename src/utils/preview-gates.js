/**
 * Preview rendering gates.
 *
 * These pure helpers decide whether Mermaid / KaTeX output should be
 * rendered for a given settings object. They are consumed by both the
 * settings panel (to keep the markdown service in sync) and the preview
 * convert() path (to skip expensive or unwanted rendering work).
 */

/**
 * Return true if Mermaid diagrams should be rendered.
 *
 * Defaults to true when the setting is missing so existing documents
 * that never toggled the checkbox keep rendering diagrams.
 *
 * @param {Object} [settings]
 * @param {Object} [settings.preview]
 * @param {boolean} [settings.preview.mermaid]
 * @returns {boolean}
 */
export function shouldRenderMermaid(settings) {
    if (settings && settings.preview && typeof settings.preview.mermaid === 'boolean') {
        return settings.preview.mermaid;
    }
    return true;
}

/**
 * Return true if KaTeX math rendering should be rendered.
 *
 * Defaults to true when the setting is missing so existing documents
 * that never toggled the checkbox keep rendering math.
 *
 * @param {Object} [settings]
 * @param {Object} [settings.preview]
 * @param {boolean} [settings.preview.mathRendering]
 * @returns {boolean}
 */
export function shouldRenderKatex(settings) {
    if (settings && settings.preview && typeof settings.preview.mathRendering === 'boolean') {
        return settings.preview.mathRendering;
    }
    return true;
}
