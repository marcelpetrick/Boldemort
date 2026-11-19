// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import { analyze, limits, measureLimit } from '../src/analysis.ts';
import {
  Document,
  bulletLines,
  formatSelection,
  formatTyping,
  selectionStyles,
  type Frame,
} from '../src/document.ts';
import { convert, inspectMarkdown, project } from '../src/markdown.ts';
import {
  decode,
  defaultLineStyles,
  graphemes,
  randomizeUnicode,
  styleUnicode,
} from '../src/unicode.ts';

function draft(
  text: string,
  start = 0,
  end = text.length,
  mode: Frame['mode'] = 'markdown',
): Frame {
  return { text, start, end, mode };
}

function edit(doc: Document, text: string, at = text.length, kind = '') {
  doc.edit(text, { start: at, end: at }, kind);
}

function markdownDraft(text: string) {
  const doc = new Document();
  doc.switchTo('markdown');
  edit(doc, text);
  doc.switchTo('unicode');
  return doc;
}

describe('projected editing', () => {
  it('keeps exact delimiters through additions, removals and replacement inside a span', () => {
    const doc = markdownDraft('**one** and __two__');
    edit(doc, 'Start 𝐨𝐧𝐞 and 𝐭𝐰𝐨');
    expect(doc.output('markdown')).toBe('Start **one** and __two__');
    edit(doc, 'Start 𝐨𝐧𝐞 plus 𝐭𝐰𝐨');
    edit(doc, 'Start 𝐨𝐧𝐞 plus 𝐭𝐰𝐨!');
    expect(doc.output('markdown')).toBe('Start **one** plus __two__!');
    edit(doc, 'Start 𝐨𝐧𝐞 plus 𝐭𝐰𝐲!');
    expect(doc.output('markdown')).toBe('Start **one** plus **twy**!');
    edit(doc, '𝐨𝐧𝐞');
    expect(doc.output('markdown')).toBe('**one**');
    edit(doc, '');
    doc.switchTo('markdown');
    expect(doc.frame).toMatchObject({ text: '', start: 0, end: 0 });
  });

  it('keeps all bytes when replacing supplementary characters with shared code units', () => {
    const doc = markdownDraft('Before **A** after __B__');
    edit(doc, 'Before 𐐀 after 𝐁');
    expect(doc.output('markdown')).toBe('Before 𐐀 after __B__');
    edit(doc, 'Before 𝐃 after 𝐁');
    expect(doc.output('markdown')).toBe('Before **D** after __B__');
    edit(doc, 'Before 𝐃 after 🙂');
    expect(doc.output('markdown')).toBe('Before **D** after 🙂');
    expect(doc.output('unicode')).toBe('Before 𝐃 after 🙂');
  });

  it('maps a selection in a later styled span and preserves unedited caret changes', () => {
    const source = 'x **Word** and _z_';
    const doc = new Document();
    doc.switchTo('markdown');
    doc.edit(source, { start: 4, end: 8 });
    doc.switchTo('unicode');
    expect(doc.frame).toMatchObject({
      text: 'x 𝐖𝐨𝐫𝐝 and 𝑧',
      start: 4,
      end: 8,
    });
    doc.select({ start: 15, end: 17 });
    doc.switchTo('markdown');
    expect(doc.frame).toMatchObject({ text: source, start: 15, end: 18 });
    doc.edit(source, { start: 1, end: 1 });
    expect(doc.frame).toMatchObject({ start: 1, end: 1 });
    doc.undo();
    expect(doc.frame.mode).toBe('unicode');
  });

  it('groups edits at the time boundary and drops redo after a divergent change', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const doc = new Document();
      expect(doc.frame).toMatchObject({ text: '', mode: 'unicode' });
      expect(doc.canUndo).toBe(false);
      expect(doc.canRedo).toBe(false);
      edit(doc, 'a', 1, 'insertText');
      vi.setSystemTime(750);
      edit(doc, 'ab', 2, 'insertText');
      vi.setSystemTime(1501);
      edit(doc, 'abc', 3, 'insertText');
      expect(doc.undo()).toBe(true);
      expect(doc.frame.text).toBe('ab');
      expect(doc.canRedo).toBe(true);
      expect(doc.undo()).toBe(true);
      expect(doc.frame.text).toBe('');
      expect(doc.redo()).toBe(true);
      expect(doc.redo()).toBe(true);
      expect(doc.frame.text).toBe('abc');
      expect(doc.undo()).toBe(true);
      expect(doc.frame.text).toBe('ab');
      edit(doc, 'ab.', 3, 'insertText');
      expect(doc.redo()).toBe(false);
      expect(doc.undo()).toBe(true);
      expect(doc.frame.text).toBe('ab');
      expect(doc.undo()).toBe(true);
      expect(doc.frame.text).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the selected line options without changing the defaults for other drafts', () => {
    const doc = new Document();
    doc.lineStyles.strike = 'long';
    doc.switchTo('markdown');
    edit(doc, '~~A~~ <u>b</u>');
    expect(doc.output('unicode')).toBe('A̶ b͟');
    expect(new Document().lineStyles).toEqual(defaultLineStyles);
  });
});

describe('formatting boundaries', () => {
  it('formats prose touching protected code while rejecting overlapping or partial ranges', () => {
    expect(formatSelection(draft('`x`A', 3, 4), 'bold')).toEqual({
      start: 3,
      end: 4,
      value: '**A**',
    });
    expect(formatSelection(draft('A`x`', 0, 1), 'bold')).toEqual({
      start: 0,
      end: 1,
      value: '**A**',
    });
    expect(formatSelection(draft('A`x`', 0, 2), 'bold')).toBeUndefined();
    expect(
      formatSelection(draft('N **word** Q', 0, 8), 'bold'),
    ).toBeUndefined();
    expect(
      formatSelection(draft('N **word** Q', 4, 12), 'bold'),
    ).toBeUndefined();
    expect(formatSelection(draft('**one _two_**'), 'bold')).toBeUndefined();
  });

  it('targets the selected graphemes without styling neighbors', () => {
    expect(
      formatSelection(draft('A👩🏽‍💻B', 2, 3, 'unicode'), 'underline'),
    ).toEqual({ start: 1, end: 8, value: '👩🏽‍💻͟' });
    expect(formatSelection(draft('AB', 0, 1, 'unicode'), 'bold')).toEqual({
      start: 0,
      end: 1,
      value: '𝐀',
    });
    expect(formatSelection(draft(' A ', 0, 3), 'italic')).toEqual({
      start: 1,
      end: 2,
      value: '*A*',
    });
    expect(formatSelection(draft('*word*'), 'italic')?.value).toBe('word');
    expect(formatSelection(draft('<u>~~**word**~~</u>'), 'strike')?.value).toBe(
      '<u>**word**</u>',
    );
  });

  it('reports only styles shared by the chosen text', () => {
    expect(selectionStyles(draft('x 𝐀 y', 2, 4, 'unicode'))).toEqual(['bold']);
    expect(selectionStyles(draft('𝐀x', 0, 3, 'unicode'))).toEqual([]);
    expect(selectionStyles(draft('   ', 0, 3, 'unicode'))).toEqual([]);
    expect(selectionStyles(draft('x **word** y', 0, 8))).toEqual([]);
    expect(selectionStyles(draft('x **word** y', 4, 12))).toEqual([]);
    expect(selectionStyles(draft('x **word** y', 4, 8))).toEqual(['bold']);
  });

  it('starts or extends typing spans only when compatible with surrounding markup', () => {
    const bold = new Set(['bold'] as const);
    expect(formatTyping(draft('10. item', 6, 6), 'x', bold).value).toBe('x');
    expect(formatTyping(draft('- item', 4, 4), 'x', bold).value).toBe('**x**');
    expect(formatTyping(draft('    text', 6, 6), 'x', bold).value).toBe('x');
    expect(formatTyping(draft('`x`A', 0, 0), 'b', bold).value).toBe('**b**');
    expect(formatTyping(draft('`x`A', 3, 3), 'b', bold).value).toBe('**b**');
    expect(formatTyping(draft('**one**\t ', 9, 9), ' two ', bold)).toEqual({
      start: 5,
      end: 9,
      value: '\t  two** ',
      caret: 11,
    });
    expect(formatTyping(draft('**one** x ', 10, 10), 'two', bold).value).toBe(
      '**two**',
    );
    expect(formatTyping(draft('*one* ', 6, 6), 'two', bold).value).toBe(
      '**two**',
    );
    expect(
      formatTyping(draft('**one** and **two** ', 20, 20), 'three', bold).value,
    ).toBe(' three**');
    expect(formatTyping(draft('**one** x', 5, 6), 'n', bold).value).toBe(
      '**n**',
    );
    expect(formatTyping(draft('𝐀', 0, 1, 'unicode'), '𝐀', bold).value).toBe(
      '𝐀',
    );
  });

  it('preserves list structure and uses only the selected logical lines', () => {
    expect(bulletLines(draft('alpha\nbeta', 0, 0)).value).toBe('- alpha');
    expect(bulletLines(draft('alpha\nbeta', 6, 6)).value).toBe('- beta');
    expect(bulletLines(draft('alpha\nbeta', 0, 6)).value).toBe('- alpha');
    expect(bulletLines(draft('alpha\nbeta', 0, 7)).value).toBe(
      '- alpha\n- beta',
    );
    expect(bulletLines(draft('   +   one\n  -')).value).toBe('   one\n  ');
    expect(bulletLines(draft('keep 10. inline\n  10. ordered')).value).toBe(
      '- keep 10. inline\n  10. ordered',
    );
    expect(bulletLines(draft('   \nnormal', 4, 10)).value).toBe('- normal');
    for (const code of ['    plain', '\tcode', '~~~\ncode\n~~~']) {
      expect(bulletLines(draft(code)).value).toBe(code);
    }
    expect(bulletLines(draft('first\n\n~~~\ncode\n~~~', 0, 5)).value).toBe(
      '- first',
    );
    expect(bulletLines(draft('~~~\ncode\n~~~\n\nlast', 14, 18)).value).toBe(
      '- last',
    );
  });
});

describe('conversion fidelity', () => {
  it.each([
    ['<u>`x`</u>', '<u>`x`</u>'],
    ['<u>one</u> and <u>two</u>', 'o͟n͟e͟ and t͟w͟o͟'],
    ['<u>one</u-extra> two</u>', '<u>one</u-extra> two</u>'],
    ['<u>unclosed', '<u>unclosed'],
    ['<span>text</span>', '<span>text</span>'],
    ['**😀** *2* __中__', '**😀** *2* __中__'],
    ['- one\n- [ ] two', '- one\n- [ ] two'],
    ['- one\n-', '- one\n-'],
    ['- one\n  continuation', '- one\n  continuation'],
    ['- one\n\n  more', '- one\n\n  more'],
    ['- **one**\n+ two', '• 𝐨𝐧𝐞\n• two'],
  ])('converts Markdown %j conservatively', (source, expected) => {
    expect(convert(source, 'markdown')).toBe(expected);
  });

  it.each([
    ['a̵ ̳b̵', '~~a ̳b~~'],
    ['a̵ ̵`𝐛`c̵', '~~a~~ ̵`𝐛`~~c~~'],
    ['• 𝐀\n\n`• 𝐁`\n\n•', '- **A**\n\n`• 𝐁`\n\n•'],
    ['𝐀̲*̲', '<u>**A**</u><u>\\*</u>'],
    ['a̵   ', '~~a~~   '],
    ['𝐀。 𝑏', '**A**。 *b*'],
    ['•\t𝐀 then • 𝐁', '-\t**A** then • **B**'],
    ['𝐀 `𝐁` 𝐂', '**A** `𝐁` **C**'],
    ['𝐀̲ ̵̲𝐁̲', '<u>**A ̵̲B**</u>'],
    ['  • 𝐀\n   • 𝐁\n    • 𝐂', '  - **A**\n   - **B**\n    • **C**'],
    ['- **A**\n\n`𝐁`\n\n𝐂', '- **A**\n\n`𝐁`\n\n**C**'],
  ])('preserves Unicode %j and its protected spans', (source, expected) => {
    expect(convert(source, 'unicode')).toBe(expected);
  });

  it('keeps empty segments out of projection and marks preserved GFM literally', () => {
    expect(project('', 'markdown')).toEqual([]);
    expect(project('**a**', 'markdown')).toEqual([
      { markdown: '**a**', unicode: '𝐚' },
    ]);
    expect(inspectMarkdown('plain  \nline').literal).toBe(false);
    expect(inspectMarkdown('plain <!-- kept -->').literal).toBe(true);
  });
});

describe('writing metrics and Unicode boundaries', () => {
  it.each([
    ['| One | Two |\n| --- | --- |\n| Three | Four |', 4],
    ['> One\n>\n> Two', 2],
    ['- One\n- Two', 2],
    ['- One\n\n  Two', 2],
    ['One\n\n<!-- hidden text -->', 1],
    ['[ref]: /url\n\nOne', 1],
    ['One  \nTwo', 2],
  ])('counts words in semantic blocks of %j', (source, words) => {
    expect(analyze(source, 'en')).toMatchObject({
      words,
      paragraphs: 1,
      warnings: [],
    });
  });

  it('counts grapheme clusters and sorts sentence lengths before taking the median', () => {
    expect(analyze('é 👨‍👩‍👦\n', 'en')).toMatchObject({ words: 1, characters: 4 });
    expect(
      analyze(
        '???\n\nOne two three four. Five. Six seven eight nine ten.',
        'en',
      ),
    ).toMatchObject({ words: 10, sentences: 3, median: 4 });
    expect(analyze('One. Two.', 'en')).toMatchObject({
      sentences: 2,
      median: 1,
    });
    expect(limits.post.source).toBe(
      'https://www.linkedin.com/help/linkedin/answer/a522483',
    );
    expect(measureLimit('a'.repeat(90), 100)).toMatchObject({ state: 'near' });
  });

  it('checks exact issue offsets and accepts structures at their limits', () => {
    const paragraph = 'word '.repeat(319) + 'word.';
    expect(paragraph.length).toBe(1600);
    expect(analyze(paragraph, 'en').warnings).toEqual([]);
    expect(analyze('> ' + paragraph + ' x', 'en').warnings).toEqual([
      { line: 1, offset: 2, key: 'longParagraph' },
    ]);
    expect(analyze('Top\n\n> ~~~~\n> text\n> ~~~', 'en').warnings).toEqual([
      { line: 3, offset: 7, key: 'fence' },
    ]);
    expect(analyze('    ignored ~~~\n    text', 'en').warnings).toEqual([]);
    expect(analyze('~~~\n~~~', 'en').warnings).toEqual([]);
    expect(analyze('> ~~~\n> text\n> ~~~~~', 'en').warnings).toEqual([]);
    expect(analyze('~~~\n\n~~~', 'en').warnings).toEqual([]);
    expect(analyze('~~~\n```', 'en').warnings).toEqual([
      { line: 1, offset: 0, key: 'fence' },
    ]);
    expect(analyze('~~~\ncode\n~~~x', 'en').warnings).toEqual([
      { line: 1, offset: 0, key: 'fence' },
    ]);
    expect(analyze('~~~\ncode\n    ~~~', 'en').warnings).toEqual([
      { line: 1, offset: 0, key: 'fence' },
    ]);
  });

  it('maps all alphabet transitions and keeps original typography on a no-op', () => {
    expect(styleUnicode('Za zA', ['bold'])).toBe('𝐙𝐚 𝐳𝐀');
    expect(styleUnicode('á̵͟', ['underline'])).toBe('á̵͟');
    expect(styleUnicode('2 𝐁', ['bold', 'italic'])).toBe('𝟐 𝑩');
    expect(decode('ℎ')).toMatchObject({ base: 'h', alternative: undefined });
    expect(randomizeUnicode('a', () => 0)).toBe('𝖺');
    expect([...graphemes('A\r\n👩🏻‍🚀')].map(({ index }) => index)).toEqual([
      0, 1, 3,
    ]);
  });
});

describe('adjacent markup and mixed script', () => {
  it('distinguishes adjacent text from the previous or next emphasis span', () => {
    expect(formatSelection(draft('foo**one**', 0, 3), 'bold')?.value).toBe(
      '**foo**',
    );
    expect(formatSelection(draft('**one**tail', 7, 11), 'bold')?.value).toBe(
      '**tail**',
    );
    expect(formatSelection(draft('___word___'), 'bold')?.value).toBe('*word*');
    expect(convert('~one~~two~', 'markdown')).toBe('o̵n̵e̵~̵~̵t̵w̵o̵');
    expect(convert('<u class="x">A</u>', 'markdown')).toBe(
      '<u class="x">A</u>',
    );
    expect(convert('<u></u>', 'markdown')).toBe('<u></u>');
    expect(inspectMarkdown('<u></u>').literal).toBe(true);
  });

  it('extends only the adjacent Markdown typing span and respects the first blank line', () => {
    const bold = new Set(['bold'] as const);
    expect(formatTyping(draft('plain **', 6, 6), 'x', bold)).toEqual({
      start: 6,
      end: 6,
      value: '**x**',
      caret: 9,
    });
    expect(formatTyping(draft('**one**  **two**', 8, 8), 'x', bold)).toEqual({
      start: 5,
      end: 8,
      value: ' x**',
      caret: 7,
    });
    expect(bulletLines(draft('\nalpha', 0, 0))).toEqual({
      start: 0,
      end: 0,
      value: '- ',
    });
    const fenced = 'one\n\n   ~~~\nbody\n   ~~~';
    expect(bulletLines(draft(fenced)).value).toBe(fenced);
  });

  it('randomizes a selected fragment without touching neighboring graphemes', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      expect(
        formatSelection(draft('x Ａb̳ y', 2, 5, 'unicode'), 'random'),
      ).toEqual({ start: 2, end: 5, value: '𝖠𝖻̳' });
      expect(
        formatSelection(draft('x Ａb̳ y', 2, 5, 'unicode'), 'underline'),
      ).toEqual({ start: 2, end: 5, value: 'Ａ͟b̳' });
    } finally {
      random.mockRestore();
    }
  });

  it('keeps gaps, list markers and newlines in their original roles', () => {
    expect(convert('a̵\tb̵', 'unicode')).toBe('~~a\tb~~');
    expect(convert('a̵\u00a0b̵', 'unicode')).toBe('~~a\u00a0b~~');
    expect(convert('a̵ \naz', 'unicode')).toBe('~~a~~ \naz');
    expect(convert('Lorem • 𝐀', 'unicode')).toBe('Lorem • **A**');
    expect(convert('• Plain', 'unicode')).toBe('- Plain');
  });

  it('uses language-aware sentence boundaries and handles the legacy fallback', async () => {
    expect(analyze('一。二。', 'ja')).toMatchObject({
      words: 2,
      sentences: 2,
      median: 1,
    });
    expect(analyze('ภาษาไทย', 'th')).toMatchObject({ words: 2 });
    vi.resetModules();
    vi.stubGlobal(
      'Intl',
      Object.create(Intl, { Segmenter: { value: undefined } }),
    );
    try {
      const { analyze: fallback } = await import('../src/analysis.ts');
      expect(
        fallback('I don’t skip. Next?!   Two more words.', 'en'),
      ).toMatchObject({ words: 7, sentences: 3, median: 3 });
      expect(
        fallback('a is rock’n’roll.   It’s neat?!  Sure.', 'en'),
      ).toMatchObject({
        words: 6,
        sentences: 3,
        median: 2,
      });
      expect(fallback('😀 😀', 'en')).toMatchObject({
        words: 0,
        sentences: 0,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('editing existing styles and emoji', () => {
  it.each([
    ['***one*** ', '***one*** **two**'],
    ['<u>**one**</u> ', '<u>**one**</u> **two**'],
    ['**one** ', '**one two**'],
    ['**one_** ', '**one_ two**'],
    ['**!** ', '**! two**'],
    ['**one** and *other* ', '**one** and *other* **two**'],
    ['~~one~~ ', '~~one~~ **two**'],
  ])('protects existing Markdown delimiters after %j', (text, expected) => {
    const point = text.length;
    const change = formatTyping(
      draft(text, point, point),
      'two',
      new Set(['bold']),
    );
    const result =
      text.slice(0, change.start) + change.value + text.slice(change.end);
    expect(result).toBe(expected);
  });

  it('continues typing after punctuation inside an armed wrapper', () => {
    const text = '**!**';
    const caret = text.length - 2;
    expect(
      formatTyping(draft(text, caret, caret), 'x', new Set(['bold'])),
    ).toEqual({ start: caret, end: caret, value: 'x' });
  });

  it.each([
    ['<u>one</u> ', ['underline'], '<u>one two</u>'],
    ['~~***one***~~ ', ['bold', 'italic', 'strike'], '~~***one two***~~'],
  ] as const)(
    'extends the armed wrapper in %j across a space',
    (text, active, expected) => {
      const change = formatTyping(
        draft(text, text.length, text.length),
        'two',
        new Set(active),
      );
      expect(text.slice(0, change.start) + change.value).toBe(expected);
      expect(change.caret).toBe(expected.indexOf('two') + 3);
    },
  );

  it('starts a new undo group when typing resumes after undo', () => {
    const doc = new Document();
    edit(doc, 'one', 3, 'insertText');
    expect(doc.undo()).toBe(true);
    edit(doc, 'two', 3, 'insertText');
    expect(doc.canRedo).toBe(false);
    expect(doc.undo()).toBe(true);
    expect(doc.frame.text).toBe('');
  });

  it('snaps a caret at a tie to the previous Unicode grapheme boundary', () => {
    const doc = new Document();
    doc.switchTo('markdown');
    doc.edit('**ABCD**', { start: 1, end: 7 });
    doc.switchTo('unicode');
    expect(doc.frame).toMatchObject({ text: '𝐀𝐁𝐂𝐃', start: 0, end: 6 });
  });

  it('retains both projected spellings when inserting at their shared boundary', () => {
    const doc = markdownDraft('__a__<u>b</u>');
    expect(doc.frame.text).toBe('𝐚b͟');
    edit(doc, '𝐚!b͟', 3, 'insertText');
    expect(doc.output('markdown')).toBe('__a__!<u>b</u>');
    expect(doc.undo()).toBe(true);
    expect(doc.output('markdown')).toBe('__a__<u>b</u>');
    expect(doc.redo()).toBe(true);
    edit(doc, '𝐚!?b͟', 4, 'insertText');
    expect(doc.undo()).toBe(true);
    expect(doc.output('markdown')).toBe('__a__!<u>b</u>');
  });

  it('preserves complete flag and emoji graphemes when native segmentation is unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal(
      'Intl',
      Object.create(Intl, { Segmenter: { value: undefined } }),
    );
    try {
      const { graphemes: fallback, styleUnicode: styleFallback } =
        await import('../src/unicode.ts');
      const source = '🇩🇪 👩🏽 👩🏽‍💻\r\n🇫🇷';
      const styled = '🇩🇪͟ ͟👩🏽͟ ͟👩🏽‍💻͟\r\n🇫🇷͟';
      expect(styleFallback(source, ['underline'])).toBe(styled);
      expect(styleFallback(styled, ['underline'], true)).toBe(source);
      expect([...fallback(styled)].map(({ segment }) => segment)).toEqual([
        '🇩🇪͟',
        ' ͟',
        '👩🏽͟',
        ' ͟',
        '👩🏽‍💻͟',
        '\r\n',
        '🇫🇷͟',
      ]);
      expect([...fallback('🇦🇧🇩\r\nA')].map(({ segment }) => segment)).toEqual([
        '🇦🇧',
        '🇩',
        '\r\n',
        'A',
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps literal conversion styles through edits beside protected ranges', () => {
    const initial = '__left__ `code` <u>right</u>';
    const original = '𝐥𝐞𝐟𝐭 `code` r͟i͟g͟h͟t͟';
    for (const location of [
      0,
      original.indexOf('`'),
      original.lastIndexOf('`') + 1,
      original.length,
    ]) {
      const doc = markdownDraft(initial);
      expect(doc.output('unicode')).toBe(original);
      const expected = new Map([
        [0, '!__left__ `code` <u>right</u>'],
        [original.indexOf('`'), '__left__ !`code` <u>right</u>'],
        [original.lastIndexOf('`') + 1, '__left__ `code`! <u>right</u>'],
        [original.length, '__left__ `code` <u>right</u>!'],
      ]);
      edit(doc, original.slice(0, location) + '!' + original.slice(location));
      expect(doc.output('markdown')).toBe(expected.get(location));
      doc.switchTo('unicode');
      doc.undo();
      expect(doc.output('markdown')).toBe(initial);
      expect(doc.undo()).toBe(true);
      expect(doc.frame.mode).toBe('markdown');
    }
  });
});
