import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter((source) => /__MARKUPS_(?:LOCAL|ANALYTICS_ALLOWED)__/.test(source));

function bootstrap(hostname) {
    const inserted = [];
    const context = {
        location: { hostname, origin: `https://${hostname}`, pathname: '/',
            href: `https://${hostname}/?api_key=synthetic-secret#s=synthetic-document` },
        document: {
            referrer: 'https://example.com/private-path?secret=synthetic-secret#s=synthetic-document',
            createElement: () => ({}),
            head: { appendChild: (script) => inserted.push(script) }
        },
        URL
    };
    context.window = context;
    for (const source of scripts) runInNewContext(source, context);
    return { inserted, calls: context.dataLayer.map((args) => Array.from(args)) };
}

describe('hosted analytics bootstrap', () => {
    it.each(['localhost', '127.0.0.1', '[::1]', 'review.vercel.app', 'fork.example.com'])(
        'never loads trackers or configures GA4 on %s', (hostname) => {
            const result = bootstrap(hostname);
            expect(result.inserted).toEqual([]);
            expect(result.calls).toEqual([]);
        }
    );

    it('loads existing production analytics with a sanitized location and referrer', () => {
        const result = bootstrap('markups.dev');
        expect(result.inserted.map((script) => script.src)).toEqual([
            'https://www.googletagmanager.com/gtag/js?id=G-8WMNRN5GFM',
            '/_vercel/insights/script.js'
        ]);
        const config = result.calls.find((args) => args[0] === 'config');
        expect(config[2]).toEqual({ page_location: 'https://markups.dev/',
            page_referrer: 'https://example.com/', page_title: 'Markups — Markdown editor' });
        expect(JSON.stringify(result)).not.toMatch(/synthetic-secret|synthetic-document|private-path/);
    });
});
