import { describe, expect, it } from 'vitest';
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
    ).toBe('𝐇𝐞𝐥𝐥𝐨 𝑚𝑦 d̲r̲a̲f̲t̲.' + structure);
    expect(convert('***hello*** ~~draft~~', 'markdown')).toBe('𝒉𝒆𝒍𝒍𝒐 d̶r̶a̶f̶t̶');
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
