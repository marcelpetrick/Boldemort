// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import { analyze } from '../src/analysis.ts';
import {
  Document,
  bulletLines,
  formatSelection,
  formatTyping,
  selectionFormatting,
  type Frame,
} from '../src/document.ts';
import { convert, inspectMarkdown } from '../src/markdown.ts';
import { mapProjectionSelection } from '../src/selection.ts';
import {
  defaultLineStyles,
  graphemes,
  styleUnicode,
  type Style,
} from '../src/unicode.ts';

function frame(
  text: string,
  start = 0,
  end = text.length,
  mode: Frame['mode'] = 'markdown',
): Frame {
  return { text, start, end, mode };
}

describe('formatting Markdown spans', () => {
  it.each([
    ['thematic break after prose', 'prefix **___**', 7, 'bold', '___'],
    ['one-sided emphasis punctuation', '~~*outside~~', 0, 'strike', '*outside'],
    ['duplicate bold wrappers', '__**a**__', 0, 'bold', 'a'],
    [
      'literal punctuation with leading whitespace',
      'a * b',
      1,
      'strike',
      '~~*~~',
    ],
  ] as const)('handles %s', (_, text, start, style, value) => {
    const end = text === 'a * b' ? 3 : text.length;
    expect(formatSelection(frame(text, start, end), style)).toEqual({
      start: text === 'a * b' ? 2 : start,
      end,
      value,
    });
  });

  it.each([
    ['ordered list at a new line', 'a\n**1. item**', 2, 13],
    ['thematic break nested in an ordered list', '1. **___**', 3, 10],
    ['indented thematic break', '  **___**', 2, 9],
    ['incomplete emphasis selection', '*a*', 2, 3],
    ['multiline emphasis', '**a\nb**', 0, 7],
    ['asterisks inside a list marker', '- *******', 2, 9],
    ['task marker', '- [x] a\n- b', 0, 2],
    ['unbalanced emphasis after prose', 'prefix ***outside**', 0, 19],
    ['unsupported Markdown wrapper', '𝐀 _ 𝐁', 0, 7],
  ] as const)('keeps %s as written', (_, text, start, end) => {
    expect(formatSelection(frame(text, start, end), 'bold')).toBeUndefined();
  });

  it.each([
    ['two bold spellings', '**a**, __b__', 'italic', '***a***, ***b***', false],
    ['adjacent runs', '**a** **b**', 'strike', '~~**a**~~ ~~**b**~~', false],
    [
      'empty list markers',
      '-\n  *\n+ \n•',
      'strike',
      '-\n  *\n+ \n~~•~~',
      true,
    ],
    [
      'inline code between plain text',
      'a `x` b',
      'italic',
      '*a* `x` *b*',
      true,
    ],
  ] as const)(
    'formats around %s',
    (_, source, style, formatted, preservedSyntax) => {
      const text = source;
      expect(formatSelection(frame(text), style)).toEqual({
        start: 0,
        end: text.length,
        value: formatted,
        preservedSyntax,
      });
    },
  );

  it('keeps literal HTML boundaries around a converted inner underline', () => {
    const text = '<u><u>a</u>b</u>';
    expect(inspectMarkdown(text).changes).toEqual([
      { start: 3, end: 11, value: 'a͟' },
    ]);
    expect(
      formatSelection(frame(text, 1, text.length - 1, 'unicode'), 'bold'),
    ).toEqual({
      start: 1,
      end: text.length - 1,
      value: 'u><u>𝐚</u>𝐛</u',
      preservedSyntax: true,
    });
  });

  it('keeps formatting controls unpressed for whitespace-only drafts', () => {
    expect(selectionFormatting(frame('  \n  '))).toEqual({
      active: [],
      random: false,
    });
  });
});

describe('typing with an armed Markdown style', () => {
  it.each([
    ['one short line', 'a', 1, 1, ' \tmore  ', ['bold'], ' \t**more**  ', 9],
    [
      'a selected triple-delimited word',
      '***a***',
      0,
      7,
      ' x ',
      ['bold', 'italic'],
      ' ***x*** ',
      5,
    ],
    [
      'a new list marker',
      '**- a**\n- **- b**',
      8,
      8,
      ' \tmore  ',
      ['bold'],
      ' \t**more**  ',
      16,
    ],
  ] as const)(
    'keeps whitespace and the caret around %s',
    (_, text, start, end, input, styles, value, caret) => {
      expect(
        formatTyping(frame(text, start, end), input, new Set<Style>(styles)),
      ).toEqual({
        start,
        end,
        value,
        caret,
      });
    },
  );
});

describe('converting selections and restoring drafts', () => {
  it.each([
    [
      'whitespace between differently spelled bold runs',
      '__one__, __two__',
      '𝐨𝐧𝐞,  𝐭𝐰𝐨',
      '__one__,  __two__',
      9,
      10,
    ],
    [
      'deletion across a projection boundary',
      'A **C** _D_ E',
      'A 𝐷 E',
      'A _D_ E',
      1,
      1,
    ],
    [
      'emoji beside a changed bold span',
      'a𝑎 **a😀** __b__',
      'a𝑎 𝐚😀 😀',
      'a*a* **a**😀 😀',
      11,
      15,
    ],
    [
      'a line ending beside a remaining projected item',
      '__a__\n\n- **b**\n- c',
      '\n_• 𝐛\n• c',
      '\n_• **b**\n- c',
      2,
      2,
    ],
  ] as const)(
    'preserves %s through editing and reload',
    (_, initial, edited, output, caret, mappedCaret) => {
      const doc = new Document();
      doc.switchTo('markdown');
      doc.edit(initial, { start: 0, end: 0 });
      doc.switchTo('unicode');
      doc.edit(edited, { start: caret, end: caret });
      expect(doc.output('unicode')).toBe(edited);
      const restored = new Document(doc.draft());
      expect(restored.frame.text).toBe(edited);
      expect(restored.output('markdown')).toBe(output);
      doc.switchTo('markdown');
      expect(doc.frame).toMatchObject({
        text: output,
        start: mappedCaret,
        end: mappedCaret,
      });
      doc.undo();
      expect(doc.frame.text).toBe(edited);
    },
  );

  it('keeps a selection across a combined accent when introducing underline tags', () => {
    const doc = new Document();
    doc.edit('á̲ •', { start: 0, end: 2 });
    doc.switchTo('markdown');
    expect(doc.frame).toMatchObject({ text: '<u>á</u> •', start: 3, end: 5 });
  });

  it('preserves positions inside Unicode glyphs in an unchanged Markdown span', () => {
    const doc = new Document();
    doc.switchTo('markdown');
    doc.edit('1𝑏', { start: 0, end: 2 });
    doc.switchTo('unicode');
    expect(doc.frame).toMatchObject({ text: '1𝑏', start: 0, end: 2 });
  });

  it.each([
    ['different decoded glyphs', '*A*', 'á', 'unicode', 0, 1, 0, 1],
    ['a narrower replacement', 'a', '𝐀', 'unicode', 0, 1, 0, 0],
    ['a different glyph boundary', '😀a', '*a', 'markdown', 0, 1, 0, 1],
    ['encoded punctuation', '&amp;', '&', 'markdown', 0, 1, 0, 0],
  ] as const)(
    'falls back to a grapheme boundary for %s',
    (_, markdown, unicode, from, start, end, targetStart, targetEnd) => {
      expect(
        mapProjectionSelection(
          [
            { markdown, unicode },
            { markdown: '__B__', unicode: '𝐁' },
          ],
          from,
          from === 'markdown' ? 'unicode' : 'markdown',
          { start, end },
        ),
      ).toEqual({ start: targetStart, end: targetEnd });
    },
  );
});

describe('Unicode style boundaries', () => {
  it('maps the transition from uppercase to lowercase mathematical letters', () => {
    expect(styleUnicode('Za', ['bold'])).toBe('𝐙𝐚');
    expect(styleUnicode('Za', ['italic'])).toBe('𝑍𝑎');
    expect(styleUnicode('Ａ', ['bold'], true)).toBe('𝐀');
  });

  it('uses the native segmenter for decomposed Hangul syllables', () => {
    expect(
      [...graphemes('\u1100\u1161')].map(({ index, segment }) => ({
        index,
        segment,
      })),
    ).toEqual([{ index: 0, segment: '가' }]);
  });

  it('consults only the complete editable glyph range when applying a style', () => {
    const editable = vi.fn(
      (start: number, end: number) => start === 0 && end === 1,
    );
    expect(
      styleUnicode('ab', ['bold'], false, defaultLineStyles, editable),
    ).toBe('𝐚b');
    expect(editable.mock.calls).toEqual([
      [0, 1],
      [1, 2],
    ]);
    editable.mockClear();
    expect(styleUnicode('ab', [], false, defaultLineStyles, editable)).toBe(
      'ab',
    );
    expect(editable).not.toHaveBeenCalled();
  });

  it('retains accents and an existing underline mark when extending underline', () => {
    const text = 'á̲ •';
    expect(
      formatSelection(frame(text, 0, text.length, 'unicode'), 'underline'),
    ).toEqual({
      start: 0,
      end: text.length,
      value: 'á̲ ͟•͟',
    });
  });

  it('does not consume an unmatched bracket beyond an inactive punctuation boundary', () => {
    expect(convert('𝑨 (𝑩!)', 'unicode')).toBe('***A (B***!)');
  });

  it('keeps a Unicode bullet without spacing literal in Markdown output', () => {
    expect(convert('-\n  *\n+ \n•', 'unicode')).toBe('-\n  *\n+ \n•');
  });
});

describe('applying bullets at line boundaries', () => {
  it.each([
    ['a selection ending at the next line', 'a\nb', 1, 2, 0, 1, '• a'],
    ['inline emphasis', '*a*', 0, 3, 0, 3, '• *a*'],
    [
      'an empty line after a closed fence',
      '\n\n~~~\n~~~\n',
      10,
      10,
      10,
      10,
      '• ',
    ],
    ['an open fence line', '\n\n~~~\n', 4, 6, 2, 5, '~~~'],
    ['a quoted code body line', '> ~~~\n> a', 7, 9, 6, 9, '> a'],
    ['a five-space code indent', '     code', 0, 9, 0, 9, '     code'],
    ['inline code', 'a `x` b', 0, 7, 0, 7, '• a `x` b'],
  ] as const)(
    'handles %s',
    (_, source, start, end, firstLine, lastLine, output) => {
      expect(bulletLines(frame(source, start, end, 'unicode'))).toEqual({
        start: firstLine,
        end: lastLine,
        value: output,
      });
    },
  );
});

describe('analysis of sparse Markdown', () => {
  it('warns about a single opening fence with the original line and offset', () => {
    expect(analyze('~~~', 'en')).toEqual({
      words: 0,
      characters: 3,
      paragraphs: 0,
      sentences: 0,
      average: undefined,
      median: undefined,
      warnings: [{ line: 1, offset: 0, key: 'fence' }],
    });
  });

  it.each(['    ~~~', '\t~~~', '>     ~~~', '-     ~~~'])(
    'treats %j as literal indented code',
    (text) => {
      expect(analyze(text, 'en').warnings).toEqual([]);
    },
  );

  it('recognizes a closed fence with carriage-return line endings', () => {
    expect(analyze('~~~\rcontent\r~~~', 'en').warnings).toEqual([]);
  });

  it('does not report an inline code span as a fence', () => {
    expect(analyze('`code` and plain text', 'en').warnings).toEqual([]);
  });
  it('excludes nonbreaking space entities from paragraph and word counts', () => {
    expect(analyze('   &nbsp;   ', 'en')).toMatchObject({
      words: 0,
      characters: 12,
      paragraphs: 0,
      sentences: 0,
      warnings: [],
    });
  });

  it('omits an inline HTML tag when measuring the surrounding prose', () => {
    expect(analyze('a<br>b', 'en')).toMatchObject({
      words: 1,
      characters: 6,
      paragraphs: 1,
      sentences: 1,
      average: 1,
      median: 1,
      warnings: [],
    });
  });
});
