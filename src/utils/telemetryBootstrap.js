const GA_ID = 'G-8WMNRN5GFM';
const PRODUCTION_HOST = 'markups.dev';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const CAMPAIGN_PARAMS = new Set(['utm_source', 'utm_medium', 'utm_campaign']);
const CAMPAIGN_VALUE = /^[A-Za-z0-9_.~-]{1,64}$/;

function hasSafeCampaignQuery(search = '') {
    const params = new globalThis.URLSearchParams(search);
    const seen = new Set();
    for (const [key, value] of params) {
        if (!CAMPAIGN_PARAMS.has(key) || seen.has(key) || !CAMPAIGN_VALUE.test(value)) return false;
        seen.add(key);
    }
    return true;
}

export function getTelemetryPolicy(location = globalThis.location) {
    const hostname = String(location?.hostname || '').toLowerCase();
    const isLocal = LOCAL_HOSTS.has(hostname);
    const hasFragment = Boolean(location?.hash);
    const safeQuery = hasSafeCampaignQuery(location?.search || '');
    const analyticsEnabled = hostname === PRODUCTION_HOST && !hasFragment && safeQuery;
    const cleanUrl = analyticsEnabled && !location?.search;
    const origin = String(location?.origin || '');
    const pathname = String(location?.pathname || '/');
    return {
        isLocal,
        analyticsEnabled,
        clarityEnabled: false,
        vercelEnabled: cleanUrl,
        pageLocation: `${origin}${pathname}`
    };
}

export function sanitizeTelemetryReferrer(referrer = '') {
    try {
        const parsed = new URL(String(referrer));
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : '';
    } catch {
        return '';
    }
}

function appendScript(document, { src, async = false, defer = false, onerror } = {}) {
    const script = document.createElement('script');
    script.async = async;
    script.defer = defer;
    script.src = src;
    if (onerror) script.onerror = onerror;
    document.head.appendChild(script);
    return script;
}

/** Load only low-data telemetry on the canonical editor host and safe URLs. */
export function initializeTelemetry({ window = globalThis.window, document = globalThis.document, pageTitle = 'Markups editor' } = {}) {
    if (!window?.location || !document?.head || typeof document.createElement !== 'function') return null;

    const policy = getTelemetryPolicy(window.location);
    window.__MARKUPS_LOCAL__ = policy.isLocal;
    window.__MARKUPS_ANALYTICS_ENABLED__ = policy.analyticsEnabled;
    if (!policy.analyticsEnabled) return policy;
    if (window.__MARKUPS_TELEMETRY_INITIALIZED__) return policy;
    window.__MARKUPS_TELEMETRY_INITIALIZED__ = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    appendScript(document, { src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, async: true });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
        page_location: policy.pageLocation,
        page_referrer: sanitizeTelemetryReferrer(document.referrer),
        page_title: pageTitle,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });

    if (policy.vercelEnabled) {
        appendScript(document, {
            src: '/_vercel/insights/script.js',
            defer: true,
            onerror: () => { /* Vercel insights is injected only on Vercel. */ }
        });
    }

    return policy;
}
