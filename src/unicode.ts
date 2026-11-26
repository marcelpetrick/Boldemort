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
const makeFont = (upper: number, lower: number, digit: number) =>
  alphabet(upper, lower).concat(
    [...digits].map((_, index) => String.fromCodePoint(digit + index)),
  );
const randomFonts = [
  makeFont(0x1d5a0, 0x1d5ba, 0x1d7e2),
  makeFont(0x1d5d4, 0x1d5ee, 0x1d7ec),
  makeFont(0x1d670, 0x1d68a, 0x1d7f6),
  makeFont(0xff21, 0xff41, 0xff10),
];
const randomGlyphs = new Set(randomFonts.flat());
const reverse = new Map<string, [string, number]>();
for (const [mask, glyphs] of maps.entries()) {
  for (const [index, glyph] of glyphs.entries())
    reverse.set(glyph, [plain[index]!, mask]);
}
for (const font of randomFonts) {
  for (const [index, glyph] of font.entries())
    reverse.set(glyph, [plain[index]!, 0]);
}

type EditableGlyph = (start: number, end: number) => boolean;

function* randomFontGlyphs(text: string, editable?: EditableGlyph) {
  for (const { segment, index } of graphemes(text)) {
    const [glyph = ''] = segment;
    const base = reverse.get(glyph)?.[0];
    const eligible =
      base !== undefined && (editable?.(index, index + segment.length) ?? true);
    yield { segment, glyph, base: eligible ? base : undefined };
  }
}

export function hasRandomFont(text: string, editable?: EditableGlyph) {
  let found = false;
  for (const { glyph, base } of randomFontGlyphs(text, editable)) {
    if (base === undefined) continue;
    if (!randomGlyphs.has(glyph)) return false;
    found = true;
  }
  return found;
}

export function randomizeUnicode(
  text: string,
  random = Math.random,
  editable?: EditableGlyph,
  toggle = false,
) {
  const glyphs = [...randomFontGlyphs(text, editable)];
  const remove =
    toggle &&
    glyphs.every(
      ({ glyph, base }) => base === undefined || randomGlyphs.has(glyph),
    );
  return glyphs
    .map(({ segment, glyph, base }) => {
      if (base === undefined) return segment;
      const tail = segment.slice(glyph.length);
      if (remove) return base + tail;
      const index = plain.indexOf(base);
      const choices = randomFonts
        .map((font) => font[index]!)
        .filter((value) => value !== glyph);
      const replacement = choices[Math.floor(random() * choices.length)]!;
      return replacement + tail;
    })
    .join('');
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
  /[\u210e\u{1d400}-\u{1d7ff}\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]|[\u0332-\u0336]|\u035f/u;
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
    /\r\n|\p{Regional_Indicator}{1,2}\p{M}*|[^\u200d\r\n]\p{M}*(?:\p{Emoji_Modifier}\p{M}*)?(?:\u200d[^\u200d\r\n]\p{M}*(?:\p{Emoji_Modifier}\p{M}*)?)*|[\s\S]/gu;
  for (const match of text.matchAll(clusters))
    yield { segment: match[0], index: match.index };
}
export function decode(segment: string) {
  const glyph = segment.slice(0, segment.codePointAt(0)! > 0xffff ? 2 : 1);
  const [base, mask] = reverse.get(glyph) ?? [glyph, 0];
  const tail = segment.slice(glyph.length);
  const rest = tail && acceptsLine.test(glyph) ? [...tail] : undefined;
  const underline = rest?.find((mark) => underlines.has(mark));
  const strike = rest?.find((mark) => strikes.has(mark));
  const active = new Set<Style>();
  if (mask & 1) active.add('bold');
  if (mask & 2) active.add('italic');
  if (underline) active.add('underline');
  if (strike) active.add('strike');
  return {
    base,
    alternative: mask === 0 && base !== glyph ? glyph : undefined,
    underline,
    strike,
    tail:
      underline || strike
        ? rest!
            .filter((mark) => !underlines.has(mark) && !strikes.has(mark))
            .join('')
        : tail,
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

export function activeUnicodeStyles(text: string, editable?: EditableGlyph) {
  const present = new Set<Style>();
  const absent = new Set<Style>();
  for (const { index, segment } of graphemes(text)) {
    if (editable && !editable(index, index + segment.length)) continue;
    const { base, active } = decode(segment);
    if (horizontalSpace.test(base)) continue;
    for (const style of styles) {
      if (supports(base, style))
        (active.has(style) ? present : absent).add(style);
    }
    if (absent.size === styles.length) return [];
  }
  return styles.filter((style) => present.has(style) && !absent.has(style));
}
function encode(item: ReturnType<typeof decode>, lineStyles: LineStyles) {
  const mask =
    Number(item.active.has('bold')) + 2 * Number(item.active.has('italic'));
  const glyph =
    (mask === 0 ? item.alternative : undefined) ??
    maps[mask]?.[plain.indexOf(item.base)] ??
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
  editable?: EditableGlyph,
) {
  if (!toggle) {
    const requested = [...selected];
    if (!requested.length) return text;
    return Array.from(graphemes(text), ({ index, segment }) => {
      if (editable && !editable(index, index + segment.length)) return segment;
      const item = decode(segment);
      const previousSize = item.active.size;
      for (const style of requested) {
        if (supports(item.base, style)) item.active.add(style);
      }
      return item.active.size === previousSize
        ? segment
        : encode(item, lineStyles);
    }).join('');
  }
  const glyphs = Array.from(graphemes(text), ({ segment, index }) => ({
    segment,
    item: decode(segment),
    editable: editable?.(index, index + segment.length) ?? true,
    changed: 0,
  }));
  for (const style of selected) {
    const eligible = glyphs.filter(
      (entry) => entry.editable && supports(entry.item.base, style),
    );
    const remove =
      eligible
        .filter(({ item }) => !horizontalSpace.test(item.base))
        .every(({ item }) => item.active.has(style)) &&
      eligible.some(({ item }) => item.active.has(style));
    const bit = 1 << styles.indexOf(style);
    for (const entry of eligible) {
      const { active } = entry.item;
      if (active.has(style) === !remove) continue;
      if (remove) active.delete(style);
      else active.add(style);
      entry.changed ^= bit;
    }
  }
  return glyphs
    .map(({ segment, item, changed }) =>
      changed ? encode(item, lineStyles) : segment,
    )
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
