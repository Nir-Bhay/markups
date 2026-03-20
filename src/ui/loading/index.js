/**
 * Loading States & Empty States — Vanilla JS utilities
 * Provides loading skeletons, spinners, and empty state CTA components
 * @module ui/loading
 */

/**
 * Loading state CSS — inject once into the document
 * @private
 */
const LOADING_STYLES = `
  .markups-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    min-height: 200px;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .markups-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-color, #e2e8f0);
    border-top-color: var(--primary-color, #3b82f6);
    border-radius: 50%;
    animation: markups-spin 0.8s linear infinite;
  }

  @keyframes markups-spin {
    to { transform: rotate(360deg); }
  }

  .markups-loading-message {
    margin-top: 16px;
    font-size: 14px;
    color: var(--text-secondary, #64748b);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .markups-skeleton {
    background: linear-gradient(
      90deg,
      var(--skeleton-base, #e2e8f0) 25%,
      var(--skeleton-shine, #f1f5f9) 50%,
      var(--skeleton-base, #e2e8f0) 75%
    );
    background-size: 200% 100%;
    animation: markups-shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
  }

  @keyframes markups-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .markups-skeleton-line {
    height: 14px;
    margin-bottom: 12px;
    width: 100%;
  }

  .markups-skeleton-line:nth-child(2n) {
    width: 75%;
  }

  .markups-skeleton-line:last-child {
    width: 50%;
  }

  .markups-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    min-height: 300px;
  }

  .markups-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .markups-empty-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
    margin-bottom: 8px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .markups-empty-description {
    font-size: 14px;
    color: var(--text-secondary, #64748b);
    margin-bottom: 24px;
    max-width: 320px;
    line-height: 1.5;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .markups-empty-action {
    padding: 10px 24px;
    background: var(--primary-color, #3b82f6);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .markups-empty-action:hover {
    background: var(--primary-hover, #2563eb);
    transform: translateY(-1px);
  }

  .markups-empty-action:active {
    transform: translateY(0);
  }

  /* Dark mode overrides */
  .dark .markups-skeleton,
  [data-theme="dark"] .markups-skeleton {
    --skeleton-base: #334155;
    --skeleton-shine: #475569;
  }

  .dark .markups-empty-title,
  [data-theme="dark"] .markups-empty-title {
    color: #e2e8f0;
  }

  .dark .markups-empty-description,
  [data-theme="dark"] .markups-empty-description {
    color: #94a3b8;
  }
`;

let stylesInjected = false;

/**
 * Inject loading state CSS into the document (only once)
 * @private
 */
function _injectStyles() {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.id = 'markups-loading-styles';
    style.textContent = LOADING_STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
}

/**
 * Show a loading spinner in a container
 * @param {HTMLElement|string} container - Container element or CSS selector
 * @param {string} [message='Loading...'] - Loading message
 */
export function showLoading(container, message = 'Loading...') {
    _injectStyles();

    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    // Store original content for restoration
    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    el.innerHTML = `
        <div class="markups-loading-container" data-loading="true">
            <div class="markups-spinner"></div>
            <div class="markups-loading-message">${message}</div>
        </div>
    `;
}

/**
 * Show a skeleton loading state (for lists/content)
 * @param {HTMLElement|string} container - Container element or CSS selector
 * @param {number} [lines=5] - Number of skeleton lines
 */
export function showSkeleton(container, lines = 5) {
    _injectStyles();

    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    const skeletonLines = Array.from({ length: lines },
        () => '<div class="markups-skeleton markups-skeleton-line"></div>'
    ).join('');

    el.innerHTML = `
        <div class="markups-loading-container" data-loading="true" style="align-items:stretch;padding:20px">
            ${skeletonLines}
        </div>
    `;
}

/**
 * Hide the loading state and restore original content
 * @param {HTMLElement|string} container - Container element or CSS selector
 */
export function hideLoading(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const loadingEl = el.querySelector('[data-loading]');
    if (loadingEl) {
        loadingEl.style.opacity = '0';
        setTimeout(() => {
            if (el.dataset.originalContent !== undefined) {
                el.innerHTML = el.dataset.originalContent;
                delete el.dataset.originalContent;
            } else {
                loadingEl.remove();
            }
        }, 300);
    }
}

/**
 * Show an empty state with icon, message, and optional CTA
 * @param {HTMLElement|string} container - Container element or CSS selector
 * @param {Object} options
 * @param {string} [options.icon='📝'] - Emoji or text icon
 * @param {string} [options.title='Nothing here yet'] - Title text
 * @param {string} [options.description] - Description text
 * @param {string} [options.actionText] - CTA button text
 * @param {Function} [options.onAction] - CTA button click handler
 */
export function showEmptyState(container, options = {}) {
    _injectStyles();

    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const {
        icon = '📝',
        title = 'Nothing here yet',
        description = '',
        actionText = '',
        onAction = null
    } = options;

    const actionHtml = actionText
        ? `<button class="markups-empty-action" id="markups-empty-cta">${actionText}</button>`
        : '';

    el.innerHTML = `
        <div class="markups-empty-state">
            <div class="markups-empty-icon">${icon}</div>
            <div class="markups-empty-title">${title}</div>
            ${description ? `<div class="markups-empty-description">${description}</div>` : ''}
            ${actionHtml}
        </div>
    `;

    // Attach click handler if provided
    if (onAction && actionText) {
        const btn = el.querySelector('#markups-empty-cta');
        if (btn) {
            btn.addEventListener('click', onAction);
        }
    }
}

export default {
    showLoading,
    showSkeleton,
    hideLoading,
    showEmptyState
};
