import { describe, expect, it, vi } from 'vitest';
import { getTelemetryPolicy, initializeTelemetry, sanitizeTelemetryReferrer } from '../utils/telemetryBootstrap.js';

function telemetryHarness(url, referrer = 'https://referrer.example/article?private=1') {
    const scripts = [];
    const calls = [];
    const location = new URL(url);
    const window = {
        location,
        gtag: (...args) => calls.push(args)
    };
    const document = {
        referrer,
        head: { appendChild: (script) => scripts.push(script) },
        createElement: vi.fn(() => ({}))
    };
    const policy = initializeTelemetry({ window, document });
    return { policy, window, scripts, calls };
}

describe('privacy-safe telemetry bootstrap', () => {
    it('uses a public editorial title and initializes only once per page', () => {
        const harness = telemetryHarness('https://markups.dev/blog');
        const scriptCount = harness.scripts.length;
        initializeTelemetry({ window: harness.window, document: harness.document, pageTitle: 'Duplicate title' });
        expect(harness.scripts).toHaveLength(scriptCount);
        expect(harness.calls.filter(call => call[0] === 'config')).toHaveLength(1);

        const window = { location: new URL('https://markups.dev/markdown-guide'), gtag: vi.fn() };
        const document = { referrer: '', head: { appendChild: vi.fn() }, createElement: () => ({}) };
        initializeTelemetry({ window, document, pageTitle: 'Markdown guide' });
        expect(window.gtag).toHaveBeenCalledWith('config', 'G-8WMNRN5GFM', expect.objectContaining({ page_title: 'Markdown guide' }));
    });

    it('does not load any tracker on Appwrite OAuth callback URLs', () => {
        const { policy, window, scripts, calls } = telemetryHarness('https://markups.dev/?userId=alice&secret=one-time-token');
        expect(policy.analyticsEnabled).toBe(false);
        expect(window.__MARKUPS_ANALYTICS_ENABLED__).toBe(false);
        expect(scripts).toEqual([]);
        expect(calls).toEqual([]);
    });

    it('does not load trackers for incoming share fragments or arbitrary query values', () => {
        expect(getTelemetryPolicy(new URL('https://markups.dev/#s=gprivate-markdown')).analyticsEnabled).toBe(false);
        expect(getTelemetryPolicy(new URL('https://markups.dev/?q=private-note')).analyticsEnabled).toBe(false);
        expect(getTelemetryPolicy(new URL('https://markups.dev/?utm_source=newsletter&token=secret')).analyticsEnabled).toBe(false);
    });

    it('sanitizes page location and referrer and limits campaign URLs to aggregate analytics', () => {
        const { policy, calls, scripts } = telemetryHarness('https://markups.dev/?utm_source=letter&utm_medium=email&utm_campaign=october');
        expect(policy).toMatchObject({ analyticsEnabled: true, clarityEnabled: false, vercelEnabled: false, pageLocation: 'https://markups.dev/' });
        expect(calls[1]).toEqual(['config', 'G-8WMNRN5GFM', {
            page_location: 'https://markups.dev/',
            page_referrer: 'https://referrer.example',
            page_title: 'Markups editor',
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        }]);
        expect(scripts.map(script => script.src)).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-8WMNRN5GFM']);
        expect(JSON.stringify(calls)).not.toContain('private');
        expect(JSON.stringify(calls)).not.toContain('october');
    });

    it('keeps Clarity replay off the editor and loads path-only Vercel analytics', () => {
        const { policy, scripts } = telemetryHarness('https://markups.dev/editor');
        expect(policy).toMatchObject({ analyticsEnabled: true, clarityEnabled: false, vercelEnabled: true });
        expect(scripts.map(script => script.src)).toEqual([
            'https://www.googletagmanager.com/gtag/js?id=G-8WMNRN5GFM',
            '/_vercel/insights/script.js'
        ]);
    });

    it('keeps preview and local builds free of telemetry requests', () => {
        expect(telemetryHarness('https://preview.example/').scripts).toEqual([]);
        const local = telemetryHarness('http://127.0.0.1:5174/');
        expect(local.policy.isLocal).toBe(true);
        expect(local.scripts).toEqual([]);
    });

    it('reduces referrers to safe HTTP origins', () => {
        expect(sanitizeTelemetryReferrer('https://name:password@referrer.example/path?token=value#secret')).toBe('https://referrer.example');
        expect(sanitizeTelemetryReferrer('javascript:alert(1)')).toBe('');
    });
});
