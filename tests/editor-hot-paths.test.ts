// SPDX-License-Identifier: GPL-3.0-or-later
import { expect, it, vi } from 'vitest';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { Document, formatSelection, formatTyping } from '../src/document.ts';
import { convert, project } from '../src/markdown.ts';
import { mapProjectionSelection } from '../src/selection.ts';
import {
  activeUnicodeStyles,
  decode,
  graphemes,
  randomizeUnicode,
} from '../src/unicode.ts';

vi.mock('mdast-util-from-markdown', { spy: true });

it('skips Markdown parsing for plain Unicode prose but recognizes an ordered marker', () => {
  const parser = vi.mocked(fromMarkdown);
  parser.mockClear();
  const text = 'A paragraph with  four spaces after a word.';
  const frame = {
    text,
    start: text.length,
    end: text.length,
    mode: 'unicode' as const,
  };
  expect(formatTyping(frame, 'a', new Set(['bold'])).value).toBe('𝐚');
  expect(formatSelection({ ...frame, start: 0 }, 'bold')?.value).toContain(
    '𝐩𝐚𝐫𝐚𝐠𝐫𝐚𝐩𝐡',
  );
  expect(parser).not.toHaveBeenCalled();

  const ordered = '10. Item';
  expect(
    formatSelection(
      { text: ordered, start: 0, end: ordered.length, mode: 'unicode' },
      'bold',
    ),
  ).toMatchObject({
    value: '10. 𝐈𝐭𝐞𝐦',
    preservedSyntax: true,
  });
  expect(parser).toHaveBeenCalledOnce();
});

it('skips the GFM parser for empty projections and plain Unicode conversion', () => {
  const parser = vi.mocked(fromMarkdown);
  parser.mockClear();
  expect(project('', 'markdown')).toEqual([]);
  expect(convert('Already plain — no glyph mappings.', 'unicode')).toBe(
    'Already plain — no glyph mappings.',
  );
  expect(parser).not.toHaveBeenCalled();
});

it('only randomizes eligible, unprotected glyphs and maps the first lowercase fullwidth letter', () => {
  expect(
    randomizeUnicode(
      'aB?',
      () => 0.99,
      (_, end) => end === 1,
    ),
  ).toBe('ａB?');
});

it('stops checking style after a single eligible glyph rules every style out', () => {
  const eligible = vi.fn(() => true);
  expect(activeUnicodeStyles('a more plain text', eligible)).toEqual([]);
  expect(eligible.mock.calls).toEqual([[0, 1]]);
  expect(activeUnicodeStyles('a͟ b͟')).toEqual(['underline']);
});

it('uses complete UTF-16 characters when decoding noncharacters and line marks', () => {
  const segment = '\uffff\u0332';
  expect(decode(segment)).toMatchObject({
    base: '\uffff',
    tail: '',
    underline: '\u0332',
  });
  expect([...graphemes(segment)].map(({ segment }) => segment)).toEqual([
    segment,
  ]);
});

it('expands a partial Unicode selection at either edge of a grapheme', () => {
  expect(
    formatSelection(
      { text: 'a😀', start: 0, end: 2, mode: 'unicode' },
      'underline',
    ),
  ).toEqual({
    start: 0,
    end: 3,
    value: 'a͟😀͟',
  });
  expect(
    formatSelection(
      { text: '😀a', start: 1, end: 3, mode: 'unicode' },
      'underline',
    ),
  ).toEqual({
    start: 0,
    end: 3,
    value: '😀͟a͟',
  });
});

it('retains isolated joiners, line breaks, and marks after the last joined modifier in the fallback', async () => {
  vi.resetModules();
  vi.stubGlobal(
    'Intl',
    Object.create(Intl, { Segmenter: { value: undefined } }),
  );
  try {
    const { graphemes: fallback } = await import('../src/unicode.ts');
    const parts = ['\u200d', '\n', '👩‍💻🏽́', 'B', '\r', 'A'];
    expect([...fallback(parts.join(''))].map(({ segment }) => segment)).toEqual(
      parts,
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

it('reports protected syntax only when the selection overlaps its source span', () => {
  const text = 'a `x` b';
  for (const [start, end, value] of [
    [0, 2, '𝐚 '],
    [5, 7, ' 𝐛'],
  ] as const) {
    expect(
      formatSelection({ text, start, end, mode: 'unicode' }, 'bold'),
    ).toEqual({
      start,
      end,
      value,
    });
  }
});

it('styles a Unicode bullet in the middle of a line as ordinary punctuation', () => {
  const text = 'a • b';
  expect(
    formatSelection(
      { text, start: 0, end: text.length, mode: 'unicode' },
      'strike',
    ),
  ).toEqual({
    start: 0,
    end: text.length,
    value: 'a̵ ̵•̵ ̵b̵',
  });
});

it('aligns both selection edges with one Markdown parse per projection', () => {
  const parser = vi.mocked(fromMarkdown);
  parser.mockClear();
  expect(
    mapProjectionSelection(
      [{ markdown: '**hello**', unicode: '𝐡𝐞𝐥𝐥𝐨' }],
      'unicode',
      'markdown',
      { start: 2, end: 4 },
    ),
  ).toEqual({ start: 3, end: 4 });
  expect(parser).toHaveBeenCalledOnce();
});

it('returns the current draft without reparsing it for an identical output mode', () => {
  const parser = vi.mocked(fromMarkdown);
  const document = new Document();
  document.switchTo('markdown');
  document.edit('**current draft**', { start: 0, end: 0 });
  parser.mockClear();
  expect(document.output('markdown')).toBe('**current draft**');
  expect(parser).not.toHaveBeenCalled();
  expect(document.output('unicode')).toBe('𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐝𝐫𝐚𝐟𝐭');
  expect(parser).toHaveBeenCalledOnce();
});
