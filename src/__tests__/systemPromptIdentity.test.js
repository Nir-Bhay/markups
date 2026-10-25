import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT } from '../features/ai-writer/system-prompt.js';

describe('public product identity in the embedded AI Writer', () => {
  it('uses the canonical Markups domain and not a legacy deployment', () => {
    expect(SYSTEM_PROMPT).toContain('https://markups.dev/');
    expect(SYSTEM_PROMPT).not.toContain('markups.vercel.app');
  });
});
