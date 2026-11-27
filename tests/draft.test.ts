// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { Document } from '../src/document.ts';
import { readDraft } from '../src/draft.ts';

describe('browser draft data', () => {
  const lineStyles = { underline: 'low', strike: 'long' } as const;
  const snapshot = {
    mode: 'unicode',
    pieces: [
      { markdown: '__Bold__', unicode: '𝐁𝐨𝐥𝐝' },
      { mode: 'unicode', text: ' 📝\n' },
    ],
    lineStyles,
  };

  it('restores both representations and line styles with fresh history', () => {
    const saved = readDraft(JSON.stringify(snapshot));
    const document = new Document(saved);
    expect(document.frame.text).toBe('𝐁𝐨𝐥𝐝 📝\n');
    expect(document.frame.start).toBe(document.frame.text.length);
    expect(document.frame.end).toBe(document.frame.start);
    expect(document.frame.mode).toBe('unicode');
    expect(document.draft()).toEqual(snapshot);
    expect(document.canUndo).toBe(false);
    expect(document.canRedo).toBe(false);
    expect(document.output('markdown')).toBe('__Bold__ 📝\n');
  });

  it('accepts unconverted Markdown and uses the restored line styles', () => {
    const saved = readDraft(
      JSON.stringify({
        mode: 'markdown',
        pieces: [{ mode: 'markdown', text: '<u>a</u> ~~b~~' }],
        lineStyles,
      }),
    );
    const document = new Document(saved);
    expect(document.frame.mode).toBe('markdown');
    expect(document.output('unicode')).toBe('a\u0332 b\u0336');
  });

  it.each([
    '{',
    'null',
    'true',
    '{"mode":"html"}',
    '{"mode":"unicode"}',
    ...[
      { pieces: [null] },
      { pieces: ['plain'] },
      { pieces: [{ mode: 'unicode', text: 42 }] },
      { pieces: [{ mode: 'markdown', text: 'pending' }] },
      { pieces: [{ unicode: 'projected' }] },
      { pieces: [{ markdown: 'projected' }] },
      { lineStyles: undefined },
      { lineStyles: { underline: 0, strike: 'short' } },
      { lineStyles: { underline: 'toString', strike: 'short' } },
      { lineStyles: { underline: 'macron', strike: 0 } },
      { lineStyles: { underline: 'macron', strike: 'toString' } },
    ].map((invalid) => JSON.stringify({ ...snapshot, ...invalid })),
  ])('discards invalid saved data (%s)', (raw) => {
    expect(readDraft(raw)).toBeUndefined();
  });
});
