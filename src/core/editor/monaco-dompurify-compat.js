/**
 * Compatibility surface for Monaco's ESM sanitizer imports.
 *
 * Monaco's inlined DOMPurify module exports named methods, while the maintained
 * `dompurify` ESM package exports one default instance. Keep Monaco on the patched
 * root package and expose only the named methods Monaco consumes.
 */
import DOMPurify from 'dompurify';

export const sanitize = (...args) => DOMPurify.sanitize(...args);
export const addHook = (...args) => DOMPurify.addHook(...args);
export const removeHook = (...args) => DOMPurify.removeHook(...args);
export default DOMPurify;
