// SPDX-License-Identifier: GPL-3.0-or-later
export const styles = ['bold', 'italic', 'underline', 'strike'] as const;
export type Style = (typeof styles)[number];
export type Mode = 'markdown' | 'unicode';

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const digits = '0123456789';
const alphabet = (upper: number, lower: number) =>
  [...letters].map((_, i) =>
    String.fromCodePoint(i < 26 ? upper + i : lower + i - 26),
  );
const bold = alphabet(0x1d400, 0x1d41a).concat(
  [...digits].map((_, i) => String.fromCodePoint(0x1d7ce + i)),
);
const italic = alphabet(0x1d434, 0x1d44e);
italic[letters.indexOf('h')] = 'ℎ';
const combined = alphabet(0x1d468, 0x1d482);
const plain = letters + digits;
const maps = [Array.from(plain), bold, italic, combined];
const reverse = new Map<string, [string, number]>();
for (const [mask, glyphs] of maps.entries()) {
  for (const [index, glyph] of glyphs.entries())
    reverse.set(glyph, [plain[index]!, mask]);
}
export const lineMarks = {
  underline: { macron: '\u035f', low: '\u0332', double: '\u0333' },
  strike: { short: '\u0335', long: '\u0336', tilde: '\u0334' },
} as const;
export type LineStyles = {
  [Kind in keyof typeof lineMarks]: keyof (typeof lineMarks)[Kind];
};
export const defaultLineStyles: LineStyles = {
  underline: 'macron',
  strike: 'short',
};
const underlines = new Set<string>(Object.values(lineMarks.underline));
const strikes = new Set<string>(Object.values(lineMarks.strike));
export const needsUnicodeDecoding =
  /[\u210e\u{1d400}-\u{1d7ff}]|[\u0332-\u0336]|\u035f/u;
const acceptsLine = /[^\s]|\p{Zs}/u;
export const horizontalSpace = /^\p{Zs}|^\t/u;
const segmenter =
  typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : undefined;
type Grapheme = { segment: string; index: number };
export function* graphemes(text: string): Iterable<Grapheme> {
  if (segmenter) {
    yield* segmenter.segment(text);
    return;
  }
  const clusters =
    /(?:\p{Regional_Indicator}{1,2}|[^\u200d]\p{M}*(?:\p{Emoji_Modifier})?(?:\u200d[^\u200d]\p{M}*(?:\p{Emoji_Modifier})?)*)|[\s\S]/gu;
  for (const match of text.matchAll(clusters))
    yield { segment: match[0], index: match.index };
}
export function decode(segment: string) {
  const [glyph = '', ...rest] = Array.from(segment);
  const [base, mask] = reverse.get(glyph) ?? [glyph, 0];
  const eligible = acceptsLine.test(glyph);
  const underline = eligible
    ? rest.find((mark) => underlines.has(mark))
    : undefined;
  const strike = eligible ? rest.find((mark) => strikes.has(mark)) : undefined;
  const active = new Set<Style>();
  if (mask & 1) active.add('bold');
  if (mask & 2) active.add('italic');
  if (underline) active.add('underline');
  if (strike) active.add('strike');
  return {
    base,
    underline,
    strike,
    tail: rest
      .filter(
        (mark) => !eligible || (!underlines.has(mark) && !strikes.has(mark)),
      )
      .join(''),
    active,
  };
}
function supports(base: string, style: Style) {
  return style === 'italic'
    ? letters.includes(base)
    : style === 'bold'
      ? plain.includes(base)
      : acceptsLine.test(base);
}
function encode(item: ReturnType<typeof decode>, lineStyles: LineStyles) {
  const mask =
    Number(item.active.has('bold')) + 2 * Number(item.active.has('italic'));
  const glyph =
    maps[mask]?.[plain.indexOf(item.base)] ??
    (mask === 3 ? bold[plain.indexOf(item.base)] : undefined) ??
    item.base;
  return (
    glyph +
    item.tail +
    (item.active.has('underline')
      ? (item.underline ?? lineMarks.underline[lineStyles.underline])
      : '') +
    (item.active.has('strike')
      ? (item.strike ?? lineMarks.strike[lineStyles.strike])
      : '')
  );
}
export function styleUnicode(
  text: string,
  selected: Iterable<Style>,
  toggle = false,
  lineStyles: LineStyles = defaultLineStyles,
) {
  const glyphs = Array.from(graphemes(text), ({ segment }) => ({
    segment,
    item: decode(segment),
  }));
  for (const style of selected) {
    const eligible = glyphs.filter(({ item }) => supports(item.base, style));
    const remove =
      toggle &&
      eligible
        .filter(({ item }) => !horizontalSpace.test(item.base))
        .every(({ item }) => item.active.has(style)) &&
      eligible.some(({ item }) => item.active.has(style));
    for (const { item } of eligible) {
      if (remove) item.active.delete(style);
      else item.active.add(style);
    }
  }
  return glyphs
    .map(({ segment, item }) => {
      const original = decode(segment);
      return styles.every(
        (style) => original.active.has(style) === item.active.has(style),
      )
        ? segment
        : encode(item, lineStyles);
    })
    .join('');
}

export function wrapMarkdown(text: string, active: ReadonlySet<Style>) {
  const emphasis = '*'.repeat(
    2 * Number(active.has('bold')) + Number(active.has('italic')),
  );
  let result = emphasis + text + emphasis;
  if (active.has('strike')) result = '~~' + result + '~~';
  if (active.has('underline')) result = '<u>' + result + '</u>';
  return result;
}
