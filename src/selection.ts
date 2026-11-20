// SPDX-License-Identifier: GPL-3.0-or-later
import type { Nodes } from 'mdast';
import { parse, type Projection } from './markdown.ts';
import { decode, graphemes, type Mode } from './unicode.ts';

type Range = { start: number; end: number };
type Glyph = Range & { segment: string };
type ProjectionGlyphs = Record<Mode, Glyph[]>;

function markdownGlyphs(source: string) {
  const result: Glyph[] = [];
  function visit(node: Nodes): boolean {
    if ('children' in node) return node.children.every(visit);
    if (node.type === 'html') return /^<\/?u>$/u.test(node.value);
    if (node.type !== 'text') return false;
    const start = node.position!.start.offset!;
    const raw = source.slice(start, node.position!.end.offset!);
    if (raw === node.value) {
      for (const { index, segment } of graphemes(raw))
        result.push({
          start: start + index,
          end: start + index + segment.length,
          segment,
        });
      return true;
    }
    let offset = 0;
    for (const { segment } of graphemes(node.value)) {
      const glyphStart = offset;
      for (const symbol of segment) {
        // Unicode output may use a Markdown escape for a literal character.
        if (raw[offset] === '\\' && raw.startsWith(symbol, offset + 1))
          offset++;
        if (!raw.startsWith(symbol, offset)) return false;
        offset += symbol.length;
      }
      result.push({ start: start + glyphStart, end: start + offset, segment });
    }
    return offset === raw.length;
  }
  return visit(parse(source)) ? result : undefined;
}

function align(piece: Projection): ProjectionGlyphs | undefined {
  const markdown = markdownGlyphs(piece.markdown);
  const unicode = Array.from(
    graphemes(piece.unicode),
    ({ index, segment }) => ({
      start: index,
      end: index + segment.length,
      segment,
    }),
  );
  if (markdown?.length !== unicode.length) return;
  const plain = (segment: string) => {
    const { base, tail } = decode(segment);
    return base + tail;
  };
  if (
    !markdown.every(
      ({ segment }, index) => plain(segment) === plain(unicode[index]!.segment),
    )
  )
    return;
  return { markdown, unicode };
}

function boundary(glyphs: Glyph[], offset: number) {
  for (const [index, { start, end }] of glyphs.entries()) {
    if (offset <= start) return index;
    if (offset < end) return offset - start <= end - offset ? index : index + 1;
  }
  return glyphs.length;
}

function nearestBoundary(text: string, estimate: number) {
  let closest = 0;
  for (const { index } of graphemes(text))
    if (Math.abs(index - estimate) < Math.abs(closest - estimate))
      closest = index;
  return text.length - estimate < Math.abs(closest - estimate)
    ? text.length
    : closest;
}

export function mapProjectionSelection(
  pieces: Projection[],
  from: Mode,
  to: Mode,
  selection: Range,
): Range {
  const collapsed = selection.start === selection.end;
  const cache = new Map<Projection, ProjectionGlyphs | undefined>();

  function map(edge: keyof Range) {
    const position = selection[edge];
    let sourceOffset = 0;
    let targetOffset = 0;
    for (const piece of pieces) {
      const source = piece[from];
      const target = piece[to];
      const local = position - sourceOffset;
      if (
        local < source.length ||
        (local === source.length && (collapsed || edge === 'end'))
      ) {
        if (source === target) return targetOffset + local;
        const coversPiece =
          selection.start <= sourceOffset &&
          selection.end >= sourceOffset + source.length;
        if (collapsed || coversPiece) {
          if (local === 0) return targetOffset;
          if (local === source.length) return targetOffset + target.length;
        }
        if (!cache.has(piece)) cache.set(piece, align(piece));
        const glyphs = cache.get(piece);
        if (!glyphs)
          return (
            targetOffset +
            nearestBoundary(target, (target.length * local) / source.length)
          );
        const index = boundary(glyphs[from], local);
        return (
          targetOffset +
          (edge === 'start' || collapsed
            ? (glyphs[to][index]?.start ?? target.length)
            : (glyphs[to][index - 1]?.end ?? 0))
        );
      }
      sourceOffset += source.length;
      targetOffset += target.length;
    }
    return targetOffset;
  }

  const start = map('start');
  return { start, end: collapsed ? start : Math.max(start, map('end')) };
}
