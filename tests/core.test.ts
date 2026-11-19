import { describe, expect, it, vi } from 'vitest';
import {
  Document,
  bulletLines,
  formatSelection,
  formatTyping,
  selectionStyles,
} from '../src/document.ts';
import { convert, inspectMarkdown, parse, project } from '../src/markdown.ts';
import {
  graphemes,
  defaultLineStyles,
  randomizeUnicode,
  decode,
  lineMarks,
  styleUnicode,
  styles,
  wrapMarkdown,
} from '../src/unicode.ts';
import { analyze, limits, measureLimit } from '../src/analysis.ts';
import { explanation, help, localize, messages } from '../src/i18n.ts';

const select = (
  text: string,
  mode: 'markdown' | 'unicode' = 'markdown',
  start = 0,
  end = text.length,
) => ({ text, mode, start, end });
const plain = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
describe('Unicode styling', () => {
  it('round-trips supported alphabets, digits, lone surrogates, accents and clusters', () => {
    for (const style of styles) {
      const source = plain + ' é e\u0301 中文 👩🏽‍💻 🏳️‍🌈\ud800';
      const styled = styleUnicode(source, [style]);
      expect(styleUnicode(styled, [style], true)).toBe(source);
      expect(styleUnicode(styled, [style])).toBe(styled);
    }
    expect(styleUnicode('h 123', ['italic'])).toBe('ℎ 123');
    expect(styleUnicode('h 123', ['italic', 'bold'])).toBe('𝒉 𝟏𝟐𝟑');
    expect(styleUnicode('a𝐛', ['bold'], true)).toBe('𝐚𝐛');
    expect(Array.from(graphemes('á👩🏽‍💻\r\n'))).toHaveLength(3);
    expect(wrapMarkdown('x', new Set(styles))).toBe('<u>~~***x***~~</u>');
  });
});

describe('GFM source conversion', () => {
  it('converts plain inline emphasis and preserves GFM structures', () => {
    const structure =
      '\n\n# Heading\n\n- [x] Task\n  - Child\n\n| A | B |\n| :- | -: |\n| 1 | 2 |\n\n~~~js\n**literal**\n~~~\n\n![alt](url) [source](https://example.com)\n\n> **Quote**\n';
    expect(
      convert('**Hello** *my* <u>draft</u>.' + structure, 'markdown'),
    ).toBe('𝐇𝐞𝐥𝐥𝐨 𝑚𝑦 d͟r͟a͟f͟t͟.' + structure);
    expect(convert('***hello*** ~~draft~~', 'markdown')).toBe('𝒉𝒆𝒍𝒍𝒐 d̵r̵a̵f̵t̵');
    expect(convert('__one__ _two_', 'markdown')).toBe('𝐨𝐧𝐞 𝑡𝑤𝑜');
    expect(convert('𝐇𝐞𝐥𝐥𝐨 𝐰𝐨𝐫𝐥𝐝.', 'unicode')).toBe('**Hello world**.');
    expect(convert('𝐀. 𝐁 <u>x</u>', 'unicode')).toBe('**A**. **B** <u>x</u>');
    expect(convert('👩🏽‍💻 unknown ', 'unicode')).toBe('👩🏽‍💻 unknown ');
    expect(convert('**[x](url)** and **a\\*b**', 'markdown')).toBe(
      '**[x](url)** and **a\\*b**',
    );
    expect(convert('`𝐯𝐚𝐥𝐮𝐞`', 'unicode')).toBe('`𝐯𝐚𝐥𝐮𝐞`');
    expect(convert('𝐀 𝑏\n𝐂', 'unicode')).toBe('**A** *b*\n**C**');
    expect(parse('https://example.com').children[0]?.type).toBe('paragraph');
    expect(project('', 'unicode')).toEqual([]);
    expect(inspectMarkdown('Plain text').literal).toBe(false);
  });

  it('remembers both originals and retains unaffected source through edits', () => {
    const doc = new Document();
    const original = '__one__\n\n**two** and `code`\n\n# End';
    doc.edit(original, { start: 0, end: original.length });
    doc.switchTo('markdown');
    doc.switchTo('unicode');
    doc.switchTo('markdown');
    expect(doc.frame.text).toBe(original);
    doc.switchTo('unicode');
    const updated = doc.frame.text.replace('and', 'plus') + ' 👋';
    doc.edit(updated, { start: 3, end: 3 });
    expect(doc.output('markdown')).toBe(
      original.replace('and', 'plus') + ' 👋',
    );
    expect(doc.output('unicode')).toBe(updated);
    expect(doc.undo()).toBe(true);
    expect(doc.redo()).toBe(true);
    expect(doc.frame.text).toBe(updated);
    expect(doc.canUndo).toBe(true);
    expect(doc.canRedo).toBe(false);
    doc.switchTo('markdown');
    doc.switchTo('markdown');
    expect(doc.frame.text).toBe(original.replace('and', 'plus') + ' 👋');
  });

  it('retains the Unicode original for combinations without an exact Markdown spelling', () => {
    const doc = new Document();
    const original = '𝗛𝗲𝗹𝗹𝗼 𝐚 👩🏽‍💻 a̶̲';
    doc.edit(original, { start: 0, end: 0 });
    doc.switchTo('markdown');
    doc.switchTo('unicode');
    expect(doc.frame.text).toBe(original);
    doc.edit(original.replace('𝐚', '𝐛'), { start: 0, end: 0 });
    expect(doc.output('markdown')).toContain('**b**');
  });
});

describe('toolbar and document history', () => {
  it('protects syntax and toggles Markdown wrappers on a selection', () => {
    expect(formatSelection(select(' word '), 'bold')).toEqual({
      start: 1,
      end: 5,
      value: '**word**',
    });
    expect(formatSelection(select('**word**'), 'bold')?.value).toBe('word');
    expect(
      formatSelection(select('**word**', 'markdown', 2, 6), 'italic')?.value,
    ).toBe('***word***');
    expect(formatSelection(select('<u>word</u>'), 'underline')?.value).toBe(
      'word',
    );
    expect(formatSelection(select('~~word~~'), 'bold')?.value).toBe(
      '~~**word**~~',
    );
    expect(formatSelection(select('***word***'), 'bold')?.value).toBe('*word*');
    expect(
      formatSelection(select('**word**', 'markdown', 2, 4), 'italic'),
    ).toBeUndefined();
    for (const text of [
      '`word`',
      '# title',
      '  ',
      'some\nwords',
      'word^*',
      '**word** beside',
    ]) {
      expect(formatSelection(select(text), 'bold')).toBeUndefined();
    }
    expect(formatSelection(select('𝐀B', 'unicode'), 'bold')?.value).toBe('𝐀𝐁');
    expect(
      formatSelection(select('a👩🏽‍💻b', 'unicode', 2, 3), 'underline')?.value,
    ).toContain('👩🏽‍💻');
    expect(selectionStyles(select('𝐀𝐁', 'unicode'))).toEqual(['bold']);
    expect(selectionStyles(select('**word**'))).toEqual(['bold']);
    expect(selectionStyles(select('hello', 'markdown', 3, 3))).toEqual([]);
  });

  it('formats future typing and preserves code content and list structure', () => {
    const active = new Set(['bold'] as const);
    expect(formatTyping(select('', 'unicode'), 'ab', active).value).toBe('𝐚𝐛');
    expect(formatTyping(select('', 'markdown'), ' ab ', active)).toEqual({
      start: 0,
      end: 0,
      value: ' **ab** ',
      caret: 5,
    });
    const inside = select('**ab**', 'markdown', 4, 4);
    expect(formatTyping(inside, 'c', active).value).toBe('c');
    expect(formatTyping(inside, '\n', active).start).toBe(6);
    expect(formatTyping(select('', 'markdown'), ' ', active).value).toBe(' ');
    expect(
      formatTyping(select('`abc`', 'markdown', 3, 3), 'z', active).value,
    ).toBe('z');
    expect(bulletLines(select('one\n  two\n3. three\n- [x] four')).value).toBe(
      '- one\n  - two\n3. three\n- [x] four',
    );
    expect(bulletLines(select('- one\n  * two')).value).toBe('one\n  two');
    expect(bulletLines(select('one\ntwo', 'unicode', 4, 7)).value).toBe(
      '• two',
    );
    expect(bulletLines(select('one\ntwo', 'markdown', 0, 4)).value).toBe(
      '- one',
    );
    expect(bulletLines(select('~~~\ncode\n~~~')).value).toBe('~~~\ncode\n~~~');
  });

  it('groups ordinary typing, resets grouping and supports empty/no-op edits', () => {
    const doc = new Document();
    expect(doc.undo()).toBe(false);
    expect(doc.redo()).toBe(false);
    doc.edit('', { start: 0, end: 0 });
    doc.edit('a', { start: 1, end: 1 }, 'insertText');
    doc.edit('ab', { start: 2, end: 2 }, 'insertText');
    doc.undo();
    expect(doc.frame.text).toBe('');
    doc.redo();
    expect(doc.frame.text).toBe('ab');
    doc.endGroup();
    doc.edit('abc', { start: 3, end: 3 }, 'insertText');
    doc.undo();
    expect(doc.frame.text).toBe('ab');
    for (let index = 0; index < 101; index++)
      doc.edit(String(index), { start: 0, end: 0 });
    for (let index = 0; index < 100; index++) expect(doc.undo()).toBe(true);
    expect(doc.undo()).toBe(false);
  });
});

describe('writing assistance', () => {
  it('counts semantic words, handles empty input, and reports high-confidence issues', () => {
    expect(analyze('', 'en')).toMatchObject({
      words: 0,
      characters: 0,
      paragraphs: 0,
      average: undefined,
      median: undefined,
    });
    expect(analyze('**One.** Two three. Four five six.', 'en')).toMatchObject({
      words: 6,
      paragraphs: 1,
      average: 2,
      median: 2,
    });
    expect(analyze('One. Two three four.', 'en')).toMatchObject({
      average: 2,
      median: 2,
    });
    expect(analyze('𝐎𝐧𝐞. Two three.', 'en')).toMatchObject({
      words: 3,
      average: 1.5,
    });
    expect(analyze('Opening.\n\n~~~\ncode', 'en').warnings).toEqual([
      { line: 3, offset: 10, key: 'fence' },
    ]);
    expect(analyze('~~~\ncode\n~~~\n\n\\*escaped*', 'en').warnings).toEqual([]);
    expect(analyze('| 1 | 2 |\n| - | - |\n| 1 |', 'en').warnings[0]?.key).toBe(
      'table',
    );
    expect(analyze('long '.repeat(400), 'en').warnings[0]?.key).toBe(
      'longParagraph',
    );
    expect(analyze('![caption](pic)\n\nfoo  \nbar', 'en').words).toBe(3);
    expect(analyze('Straße. Zwei Wörter.', 'de').words).toBe(3);
  });
  it('measures copied units and localizes visible help', () => {
    expect(measureLimit('𝐚', 2)).toEqual({
      used: 2,
      remaining: 0,
      state: 'near',
    });
    expect(measureLimit('𝐚', 1)).toEqual({
      used: 2,
      remaining: -1,
      state: 'over',
    });
    expect(measureLimit('', limits.post.max).state).toBe('within');
    for (const locale of ['en', 'de'] as const) {
      for (const key of Object.keys(messages) as Array<keyof typeof messages>)
        expect(localize(locale, key)).toBeTruthy();
      for (const key of Object.keys(help) as Array<keyof typeof help>)
        expect(explanation(locale, key).long).toBeTruthy();
    }
    expect(localize('de', 'line', { line: '2' })).toBe('Zeile 2');
  });
});

it('uses fallback segmentation without Intl.Segmenter', async () => {
  vi.resetModules();
  vi.stubGlobal(
    'Intl',
    Object.create(Intl, { Segmenter: { value: undefined } }),
  );
  try {
    const { graphemes: fallback } = await import('../src/unicode.ts');
    const { analyze: fallbackAnalyze } = await import('../src/analysis.ts');
    expect([...fallback('é👩🏽‍💻🇩🇪')].map(({ segment }) => segment)).toEqual([
      'é',
      '👩🏽‍💻',
      '🇩🇪',
    ]);
    expect(fallbackAnalyze("One. Don't skip words.", 'en')).toMatchObject({
      words: 4,
      median: 2,
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

it('keeps caret mapping and intact Unicode while changing projected chunks', () => {
  const doc = new Document();
  doc.switchTo('markdown');
  doc.edit('__one__ __two__', { start: 0, end: 15 });
  doc.switchTo('unicode');
  expect(doc.frame).toMatchObject({ text: '𝐨𝐧𝐞 𝐭𝐰𝐨', start: 0, end: 13 });
  doc.edit('𝐨𝐧𝐞, 𝐭𝐰𝐨', { start: 7, end: 7 });
  expect(doc.output('markdown')).toBe('__one__, __two__');
  doc.edit('𝐨𝐧𝐞, 𝐭𝐰𝐲', { start: 14, end: 14 });
  expect(doc.output('markdown')).toBe('__one__, **twy**');
  doc.edit('𝐨𝐧𝐞, 𝐭𝐰🟲', { start: 14, end: 14 });
  expect(doc.output('markdown')).toBe('__one__, **tw**🟲');
  doc.switchTo('markdown');
  expect(doc.frame.end).toBe(doc.frame.text.length);
});

it('reparses context around edits while retaining recognized source mappings', () => {
  const doc = new Document();
  doc.switchTo('markdown');
  const original = '__one__ and **two**';
  doc.edit(original, { start: 0, end: 0 });
  expect(doc.output('unicode')).toBe('𝐨𝐧𝐞 and 𝐭𝐰𝐨');
  doc.switchTo('unicode');
  doc.switchTo('markdown');
  doc.edit('`__one__` and **two**', { start: 0, end: 0 });
  expect(doc.output('unicode')).toBe('`__one__` and 𝐭𝐰𝐨');

  expect(
    formatSelection(select('`code`', 'unicode', 1, 5), 'bold'),
  ).toBeUndefined();
  expect(
    formatTyping(select('`code`', 'unicode', 3, 3), 'x', new Set(['bold']))
      .value,
  ).toBe('x');
  expect(bulletLines(select('-   [x] Task')).value).toBe('-   [x] Task');
  expect(bulletLines(select('-   [x] Task\n- plain')).value).toBe(
    '-   [x] Task\n- plain',
  );
  expect(convert('- **One**\n- Two', 'markdown')).toBe('• 𝐎𝐧𝐞\n• Two');
  expect(convert('• 𝐎𝐧𝐞\n• Two', 'unicode')).toBe('- **One**\n- Two');
  expect(convert('Use • inline\n\n- [ ] Task', 'unicode')).toBe(
    'Use • inline\n\n- [ ] Task',
  );
  expect(convert('- First\n  - Nested\n\n3. Third', 'markdown')).toBe(
    '- First\n  - Nested\n\n3. Third',
  );
});

it('matches the expected mathematical glyph values at alphabet boundaries', () => {
  expect(styleUnicode('AZaz09', ['bold'])).toBe('𝐀𝐙𝐚𝐳𝟎𝟗');
  expect(styleUnicode('AZahz09', ['italic'])).toBe('𝐴𝑍𝑎ℎ𝑧09');
  expect(styleUnicode('AZaz09', ['bold', 'italic'])).toBe('𝑨𝒁𝒂𝒛𝟎𝟗');
});

it('uses exact line marks for defaults, alternate styles and word gaps', () => {
  expect(styleUnicode('Hi all', ['strike'])).toBe('H̵i̵ ̵a̵l̵l̵');
  expect(styleUnicode('Hi all', ['underline'])).toBe('H͟i͟ ͟a͟l͟l͟');
  expect(styleUnicode('Hi\tall\r\né 👩🏽‍💻', ['strike'])).toBe('H̵i̵\ta̵l̵l̵\r\né̵ ̵👩🏽‍💻̵');
  expect(styleUnicode('a̶ b̶', ['strike'], true)).toBe('a b');
  expect(styleUnicode('a̴̳', ['bold'])).toBe('𝐚̴̳');
  expect(styleUnicode('é̴̳', ['underline'], true)).toBe('é̴');
  for (const underline of ['macron', 'low', 'double'] as const) {
    const mark = lineMarks.underline[underline];
    const styled = styleUnicode('a b', ['underline'], false, {
      ...defaultLineStyles,
      underline,
    });
    expect(styled).toBe('a' + mark + ' ' + mark + 'b' + mark);
    expect(convert(styled, 'unicode')).toBe('<u>a b</u>');
  }
  for (const strike of ['short', 'long', 'tilde'] as const) {
    const mark = lineMarks.strike[strike];
    const styled = styleUnicode('a b', ['strike'], false, {
      ...defaultLineStyles,
      strike,
    });
    expect(styled).toBe('a' + mark + ' ' + mark + 'b' + mark);
    expect(convert(styled, 'unicode')).toBe('~~a b~~');
  }
  const doc = new Document();
  doc.edit('a̳ ̳b̳', { start: 0, end: 0 });
  doc.switchTo('markdown');
  expect(doc.frame.text).toBe('<u>a b</u>');
  doc.lineStyles.underline = 'low';
  doc.switchTo('unicode');
  expect(doc.frame.text).toBe('a̳ ̳b̳');
});

it('removes single-tilde GFM strikethrough and keeps armed word gaps outside closing markers', () => {
  expect(formatSelection(select('~word~'), 'strike')?.value).toBe('word');
  expect(formatSelection(select('~word~'), 'bold')?.value).toBe('~~**word**~~');
  const active = new Set(['bold'] as const);
  expect(
    formatTyping(select('**one**', 'markdown', 5, 5), ' ', active),
  ).toEqual({ start: 7, end: 7, value: ' ' });
  expect(
    formatTyping(select('**one** ', 'markdown', 8, 8), 't', active),
  ).toEqual({ start: 5, end: 8, value: ' t**', caret: 7 });
});

it('reports malformed fence closers while accepting correctly closed and nested fences', () => {
  for (const invalid of ['```\ncode\n```~', '```\ncode\n    ```']) {
    expect(analyze(invalid, 'en').warnings[0]?.key).toBe('fence');
  }
  for (const valid of [
    '```\n    ```\n```',
    '> ```\n> code\n> ```',
    '```\n\n```',
  ]) {
    expect(analyze(valid, 'en').warnings).toEqual([]);
  }
});

it('mixes compatible copyable fonts while preserving content and line marks', () => {
  const source = 'Aé é 2 中 👩🏽‍💻 a̴̳';
  const mixed = randomizeUnicode(source, () => 0);
  expect(mixed).toBe('𝖠é 𝖾́ 𝟤 中 👩🏽‍💻 𝖺̴̳');
  expect(randomizeUnicode('Ab2', () => 0.99)).toBe('Ａｂ２');
  expect(randomizeUnicode('𝖠', () => 0)).toBe('𝗔');
  expect(decode('Ａ').base).toBe('A');
  expect(styleUnicode('𝖠', ['underline'])).toBe('𝖠͟');
  expect(convert('𝖠͟', 'unicode')).toBe('<u>𝖠</u>');
  expect(convert('<u>𝖠</u>', 'markdown')).toBe('𝖠͟');
  expect(analyze('𝖠 ｂ𝟤', 'en').words).toBe(2);
  expect(convert('Ａ𝖾', 'unicode')).toBe('Ａ𝖾');
  expect(formatSelection(select('code'), 'random')).toBeUndefined();
  expect(
    formatSelection(select('`code`', 'unicode'), 'random'),
  ).toBeUndefined();
  expect(
    formatTyping(
      select('', 'unicode'),
      'x',
      new Set(['underline']),
      defaultLineStyles,
      true,
    ).value,
  ).toMatch(/͟$/u);
});
