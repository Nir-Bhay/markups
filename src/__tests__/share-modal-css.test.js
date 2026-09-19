import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const indexHtml = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8');
const premiumCss = readFileSync(resolve(import.meta.dirname, '../../public/css/premium-ui.css'), 'utf8');
const vercelJson = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../../vercel.json'), 'utf8')
);

describe('share modal CSS must not inherit export-modal row layout', () => {
    it('cache-busts unhashed app CSS so Share cards are not stuck on a year-long immutable cache', () => {
        expect(indexHtml).toMatch(/href="\/css\/premium-ui\.css\?v=/);
        expect(indexHtml).toMatch(/href="\/css\/video-controls\.css\?v=/);
    });

    it('uses a higher-specificity column layout than .export-modal-content', () => {
        expect(premiumCss).toContain('.export-modal.share-modal .export-modal-content');
        expect(premiumCss).toMatch(
            /\.export-modal\.share-modal\s+\.export-modal-content[\s\S]{0,180}flex-direction:\s*column/
        );
    });

    it('does not mark /css/ as immutable', () => {
        const cssHeader = vercelJson.headers.find((entry) => entry.source === '/css/(.*)');
        const cacheControl = cssHeader?.headers?.find((header) => header.key === 'Cache-Control')?.value || '';
        expect(cacheControl).not.toMatch(/immutable/i);
        expect(cacheControl).toMatch(/must-revalidate/i);
    });
});
