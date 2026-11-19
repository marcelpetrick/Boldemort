// SPDX-License-Identifier: GPL-3.0-or-later
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import {
  decode,
  defaultLineStyles,
  horizontalSpace,
  needsUnicodeDecoding,
  type LineStyles,
  graphemes,
  styleUnicode,
  styles,
  wrapMarkdown,
  type Mode,
  type Style,
} from './unicode.ts';

export function parse(source: string) {
  return fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}
type Node =
  | ReturnType<typeof parse>['children'][number]
  | import('mdast').PhrasingContent;
type Positioned = { start: number; end: number };
export type Change = Positioned & { value: string };
export type Projection = {
  markdown: string;
  unicode: string;
};
const emphasis = new Map<string, Style>([
  ['strong', 'bold'],
  ['emphasis', 'italic'],
  ['delete', 'strike'],
]);
function span(node: Pick<Node, 'position'>): Positioned {
  return {
    start: node.position!.start.offset!,
    end: node.position!.end.offset!,
  };
}
function inline(
  node: Node,
  source: string,
  active: ReadonlySet<Style>,
  lineStyles: LineStyles,
): string | undefined {
  if (node.type === 'text') {
    const { start, end } = span(node);
    const raw = source.slice(start, end);
    return raw === node.value
      ? styleUnicode(raw, active, false, lineStyles)
      : undefined;
  }
  const style = emphasis.get(node.type);
  if (!style || !('children' in node)) return undefined;
  return renderInline(
    node.children,
    source,
    new Set([...active, style]),
    lineStyles,
  );
}
function renderInline(
  nodes: Node[],
  source: string,
  active: ReadonlySet<Style>,
  lineStyles: LineStyles,
) {
  let value = '';
  for (const node of nodes) {
    const rendered = inline(node, source, active, lineStyles);
    if (rendered === undefined) return undefined;
    value += rendered;
  }
  return value;
}
type MarkdownAnalysis = {
  changes: Change[];
  formattingRanges: Positioned[];
  protectedRanges: Positioned[];
  literal: boolean;
};
export function inspectMarkdown(
  source: string,
  lineStyles = defaultLineStyles,
): MarkdownAnalysis {
  const changes: Change[] = [];
  const formattingRanges: Positioned[] = [];
  const protectedRanges: Positioned[] = [];
  let literal = false;
  function recordFormatting(range: Positioned, children: Node[]) {
    formattingRanges.push(range);
    for (const child of children) {
      if (emphasis.has(child.type) && 'children' in child)
        recordFormatting(span(child), child.children);
    }
  }
  const visit = (nodes: Node[]) => {
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index]!;
      const range = span(node);
      if (node.type === 'html' && node.value === '<u>') {
        const closing = nodes.findIndex(
          (item, i) =>
            i > index && item.type === 'html' && /^<\/?u>$/i.test(item.value),
        );
        const end = nodes[closing];
        if (end?.type === 'html' && end.value === '</u>') {
          const body = nodes.slice(index + 1, closing);
          const value = renderInline(
            body,
            source,
            new Set(['underline']),
            lineStyles,
          );
          if (value !== undefined)
            recordFormatting({ start: range.start, end: span(end).end }, body);
          if (value !== undefined && /\S/u.test(value)) {
            changes.push({ start: range.start, end: span(end).end, value });
            index = closing;
            continue;
          }
        }
      }
      if (emphasis.has(node.type) && 'children' in node) {
        const value = inline(node, source, new Set(), lineStyles);
        if (value !== undefined) recordFormatting(range, node.children);
        if (
          value !== undefined &&
          value !==
            source
              .slice(range.start, range.end)
              .replace(/^[*~_]+|[*~_]+$/gu, '')
        ) {
          changes.push({ ...range, value });
          continue;
        }
      }
      if (
        node.type === 'list' &&
        !node.ordered &&
        node.children.every(
          (item) =>
            item.checked == null &&
            item.children.length === 1 &&
            item.children[0]?.type === 'paragraph' &&
            item.position?.start.line === item.position?.end.line,
        )
      ) {
        for (const item of node.children) {
          const { start } = span(item);
          changes.push({ start, end: start + 1, value: '•' });
          const paragraph = item.children[0];
          if (paragraph?.type === 'paragraph') visit(paragraph.children);
        }
      } else if (node.type === 'paragraph') {
        visit(node.children);
      } else if (node.type !== 'text' && node.type !== 'break') {
        literal = true;
        protectedRanges.push(range);
      }
    }
  };
  visit(parse(source).children);
  return { changes, formattingRanges, protectedRanges, literal };
}

function unicodeChanges(source: string) {
  if (!source.includes('•') && !needsUnicodeDecoding.test(source)) return [];
  const analysis = inspectMarkdown(source);
  const protectedRanges = analysis.protectedRanges
    .concat(analysis.changes)
    .sort((a, b) => a.start - b.start);
  const changes: Change[] = [];
  let protection = 0;
  let run = '';
  let runStart = 0;
  let active = new Set<Style>();
  let end = 0;
  const emit = () => {
    if (run) {
      const escaped = run.replace(/[\\`*_{}[\]<>~|]/gu, '\\$&');
      changes.push({
        start: runStart,
        end,
        value: wrapMarkdown(escaped, active),
      });
      run = '';
    }
  };
  const glyphs = Array.from(graphemes(source));
  for (let position = 0; position < glyphs.length; position++) {
    const { segment, index } = glyphs[position]!;
    while (
      protectedRanges[protection] &&
      protectedRanges[protection]!.end <= index
    )
      protection++;
    const range = protectedRanges[protection];
    if (
      segment === '•' &&
      !(range && index >= range.start) &&
      /^(?: {0,3})$/u.test(
        source.slice(source.lastIndexOf('\n', index - 1) + 1, index),
      ) &&
      /[ \t]/u.test(source[index + 1] ?? '')
    ) {
      emit();
      changes.push({ start: index, end: index + 1, value: '-' });
      continue;
    }
    const item = decode(segment);
    if (range && index >= range.start) {
      emit();
    } else if (horizontalSpace.test(item.base)) {
      if (!run) continue;
      let next = position;
      while (
        next < glyphs.length &&
        horizontalSpace.test(glyphs[next]!.segment)
      )
        next++;
      const following = glyphs[next];
      if (
        following &&
        (!range || following.index < range.start) &&
        styles.every(
          (style) =>
            decode(following.segment).active.has(style) === active.has(style),
        )
      ) {
        for (const space of glyphs.slice(position, next)) {
          const blank = decode(space.segment);
          run += [...blank.active].every((style) => active.has(style))
            ? blank.base + blank.tail
            : space.segment;
        }
        end = following.index;
        position = next - 1;
      } else emit();
    } else if (item.active.size) {
      if (styles.some((style) => item.active.has(style) !== active.has(style)))
        emit();
      if (!run) runStart = index;
      active = item.active;
      run += (item.alternative ?? item.base) + item.tail;
      end = index + segment.length;
    } else {
      emit();
    }
  }
  emit();
  return changes;
}

export function project(
  source: string,
  mode: Mode,
  lineStyles = defaultLineStyles,
): Projection[] {
  if (!source) return [];
  const changes =
    mode === 'markdown'
      ? inspectMarkdown(source, lineStyles).changes
      : unicodeChanges(source);
  const pieces: Projection[] = [];
  const append = (raw: string, converted: string) => {
    if (!raw) return;
    pieces.push(
      mode === 'markdown'
        ? { markdown: raw, unicode: converted }
        : { unicode: raw, markdown: converted },
    );
  };
  let position = 0;
  for (const { start, end, value } of changes) {
    append(source.slice(position, start), source.slice(position, start));
    append(source.slice(start, end), value);
    position = end;
  }
  append(source.slice(position), source.slice(position));
  return pieces;
}

export function convert(source: string, mode: Mode) {
  const target = mode === 'markdown' ? 'unicode' : 'markdown';
  return project(source, mode)
    .map((part) => part[target])
    .join('');
}
