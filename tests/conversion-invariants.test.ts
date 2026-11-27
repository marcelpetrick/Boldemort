// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  Document,
  formatSelection,
  formatTyping,
  selectionFormatting,
  type Frame,
} from '../src/document.ts';
import { inspectMarkdown } from '../src/markdown.ts';
import { mapProjectionSelection } from '../src/selection.ts';

function frame(
  text: string,
  mode: Frame['mode'] = 'markdown',
  start = 0,
  end = text.length,
): Frame {
  return { text, mode, start, end };
}

describe('editing alongside remembered formatting', () => {
  it('splices across several source pieces and retains the last exact delimiter spelling', () => {
    const doc = new Document();
    doc.switchTo('markdown');
    doc.edit('**A**   __B__', { start: 0, end: 0 });
    doc.switchTo('unicode');
    doc.edit('x 𝐁', { start: 1, end: 1 });

    const restored = new Document(doc.draft());
    expect(restored.frame.text).toBe('x 𝐁');
    expect(restored.output('markdown')).toBe('x __B__');
    restored.switchTo('markdown');
    expect(restored.frame.text).toBe('x __B__');
  });

  it('does not merge undo history across a redo followed by new typing', () => {
    const doc = new Document();
    doc.edit('a', { start: 1, end: 1 }, 'insertText');
    doc.undo();
    doc.redo();
    doc.edit('ab', { start: 2, end: 2 }, 'insertText');
    doc.undo();
    expect(doc.frame.text).toBe('a');
    doc.undo();
    expect(doc.frame.text).toBe('');
  });
});

describe('preserving syntax while formatting', () => {
  it('changes ordinary spans while preserving an ordered-list body', () => {
    const text = '**other**\n\n-- **10. title**';
    expect(formatSelection(frame(text), 'bold')).toEqual({
      start: 0,
      end: text.length,
      value: 'other\n\n-- **10. title**',
      preservedSyntax: true,
    });
  });

  it.each([
    ['•  ', 'strike'],
    ['1.\n)', 'bold'],
    ['\tcode', 'bold'],
    ['1.\t</u>', 'bold'],
  ] as const)('preserves syntax in the Unicode text %j', (text, style) => {
    expect(formatSelection(frame(text, 'unicode'), style)).toBeUndefined();
  });

  it('does not turn styled punctuation into an empty nested list item', () => {
    expect(
      formatSelection(frame('10. ~~+~~', 'markdown', 4), 'strike'),
    ).toBeUndefined();
  });

  it('protects code inside a strikethrough-shaped span', () => {
    expect(formatSelection(frame('~~ `x` ~~'), 'underline')).toBeUndefined();
  });

  it('keeps the toolbar unpressed for a wrapper with no stylable characters', () => {
    expect(selectionFormatting(frame('**#**'))).toEqual({
      active: [],
      random: false,
    });
  });

  it('keeps adjacent emphasis delimiters when toggling just the selected style', () => {
    expect(formatSelection(frame('_a_~~a~~', 'markdown', 4), 'strike')).toEqual(
      {
        start: 3,
        end: 8,
        value: 'a',
      },
    );
  });

  it('replaces a selected character with a plain newline while a style is armed', () => {
    expect(
      formatTyping(
        frame('a ~~b~~', 'markdown', 4, 5),
        '\n',
        new Set(['strike']),
      ),
    ).toEqual({
      start: 4,
      end: 5,
      value: '\n',
    });
  });

  it.each([
    ['<u>\t- title</u>', 0],
    ['  <u>  title</u>', 2],
    ['  <u> # heading</u>', 2],
  ] as const)(
    'keeps underline when removing it would expose a block in %j',
    (text, start) => {
      expect(
        formatSelection(frame(text, 'markdown', start), 'underline'),
      ).toBeUndefined();
    },
  );

  it('removes underline when the remaining indentation is plain text', () => {
    const text = ' <u>  title</u>';
    expect(formatSelection(frame(text, 'markdown', 1), 'underline')).toEqual({
      start: 1,
      end: text.length,
      value: '  title',
    });
  });

  it('leaves a batch intact when removing wrappers would expose structure', () => {
    const text = '**other**\n\n-- **\t- title**';
    expect(formatSelection(frame(text), 'bold')).toEqual({
      start: 0,
      end: text.length,
      value: text,
      preservedSyntax: true,
    });
  });
});

describe('classifying Markdown spans before conversion', () => {
  it('keeps an entire nested list literal when any of its items is a task', () => {
    expect(inspectMarkdown('- a\n  - b\n  - [ ] c')).toMatchObject({
      changes: [],
      delimiterRanges: [{ start: 0, end: 2 }],
      plainRanges: [{ start: 2, end: 3 }],
      protectedRanges: [{ start: 6, end: 19 }],
      literal: true,
    });
  });

  it('does not treat an escaped marker as position-compatible plain text', () => {
    expect(inspectMarkdown('a\\*b')).toMatchObject({
      changes: [],
      plainRanges: [],
      literal: false,
    });
  });

  it('protects emphasis or underline spans containing unsupported nodes', () => {
    expect(inspectMarkdown('**a `b` c**')).toMatchObject({
      changes: [],
      formattingRanges: [],
      protectedRanges: [{ start: 0, end: 11 }],
      literal: true,
    });
    expect(inspectMarkdown('<u><unknown></u>')).toMatchObject({
      changes: [],
      formattingRanges: [],
      protectedRanges: [
        { start: 0, end: 3 },
        { start: 3, end: 12 },
        { start: 12, end: 16 },
      ],
      literal: true,
    });
  });
});

describe('mapping selection across converted Markdown', () => {
  it.each(['a\n\n<!-- note --><u>', 'a\n\n<u>\nmore'])(
    'treats a longer HTML node as literal in %j',
    (markdown) => {
      expect(
        mapProjectionSelection(
          [{ markdown, unicode: 'a' }],
          'markdown',
          'unicode',
          { start: 0, end: 1 },
        ),
      ).toEqual({ start: 0, end: 0 });
    },
  );

  it('keeps the selected start inside the new span at a piece boundary', () => {
    const pieces = [
      { markdown: 'before ', unicode: 'before ' },
      { markdown: '**A**', unicode: '𝐀' },
    ];
    expect(
      mapProjectionSelection(pieces, 'unicode', 'markdown', {
        start: 7,
        end: 8,
      }),
    ).toEqual({
      start: 9,
      end: 9,
    });
  });

  it('aligns repeated glyphs that appear before a Markdown escape', () => {
    expect(
      mapProjectionSelection(
        [{ markdown: '**aa\\*b**', unicode: '𝐚𝐚*𝐛' }],
        'unicode',
        'markdown',
        { start: 1, end: 3 },
      ),
    ).toEqual({ start: 2, end: 3 });
  });
});

it.each([
  ['***a** b*', 0, 'italic', '*z*'],
  ['*a **b***', 0, 'italic', '*z*'],
  ['**a *b***', 0, 'bold', '**z**'],
  ['***a* b**', 0, 'bold', '**z**'],
] as const)(
  'keeps armed typing separate from the nested wrapper in %j',
  (text, at, style, value) => {
    expect(
      formatTyping(frame(text, 'markdown', at, at), 'z', new Set([style])),
    ).toEqual({
      start: at,
      end: at,
      value,
      caret: at + (style === 'bold' ? 3 : 2),
    });
  },
);
