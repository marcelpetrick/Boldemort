// SPDX-License-Identifier: GPL-3.0-only
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import {
  decode,
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
  literal?: boolean;
};
const emphasis = new Map<string, Style>([
  ['strong', 'bold'],
  ['emphasis', 'italic'],
  ['delete', 'strike'],
]);
function span(node: Node): Positioned {
  return {
    start: node.position!.start.offset!,
    end: node.position!.end.offset!,
  };
}
function inline(
  node: Node,
  source: string,
  active: ReadonlySet<Style>,
): string | undefined {
  if (node.type === 'text') {
    const { start, end } = span(node);
    const raw = source.slice(start, end);
    return raw === node.value ? styleUnicode(raw, active) : undefined;
  }
  const style = emphasis.get(node.type);
  if (!style || !('children' in node)) return undefined;
  return renderInline(node.children, source, new Set([...active, style]));
}
function renderInline(
  nodes: Node[],
  source: string,
  active: ReadonlySet<Style>,
) {
  let value = '';
  for (const node of nodes) {
    const rendered = inline(node, source, active);
    if (rendered === undefined) return undefined;
    value += rendered;
  }
  return value;
}
type MarkdownAnalysis = {
  changes: Change[];
  protectedRanges: Positioned[];
  literal: boolean;
};
export function inspectMarkdown(source: string): MarkdownAnalysis {
  const changes: Change[] = [];
  const protectedRanges: Positioned[] = [];
  let literal = false;
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
          const value = renderInline(body, source, new Set(['underline']));
          if (value !== undefined && /\S/u.test(value)) {
            changes.push({ start: range.start, end: span(end).end, value });
            index = closing;
            continue;
          }
        }
      }
      if (emphasis.has(node.type)) {
        const value = inline(node, source, new Set());
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
      if (node.type === 'paragraph') {
        visit(node.children);
      } else if (node.type !== 'text' && node.type !== 'break') {
        literal = true;
        protectedRanges.push(range);
      }
    }
  };
  visit(parse(source).children);
  return { changes, protectedRanges, literal };
}

function unicodeChanges(source: string) {
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
  for (const { segment, index } of graphemes(source)) {
    while (
      protectedRanges[protection] &&
      protectedRanges[protection]!.end <= index
    )
      protection++;
    const range = protectedRanges[protection];
    const item = decode(segment);
    if (
      (range && index >= range.start) ||
      (!item.active.size && !/^\s+$/u.test(segment))
    ) {
      emit();
    } else if (!item.active.size && /^[ \t]+$/u.test(segment) && run) {
      // Join spaces only when the following grapheme has the same styles.
      const following = source.slice(index).match(/^[ \t]+(\S)/u)?.[1];
      if (
        following &&
        styles.every(
          (style) => decode(following).active.has(style) === active.has(style),
        )
      ) {
        run += segment;
        end = index + segment.length;
      } else emit();
    } else if (item.active.size) {
      if (styles.some((style) => item.active.has(style) !== active.has(style)))
        emit();
      if (!run) runStart = index;
      active = item.active;
      run += item.base + item.tail;
      end = index + segment.length;
    } else {
      emit();
    }
  }
  emit();
  return { changes, literal: analysis.literal };
}

export function project(source: string, mode: Mode): Projection[] {
  if (!source) return [];
  const { changes, literal } =
    mode === 'markdown' ? inspectMarkdown(source) : unicodeChanges(source);
  const pieces: Projection[] = [];
  const append = (raw: string, converted: string, preserved = false) => {
    if (!raw) return;
    pieces.push(
      mode === 'markdown'
        ? { markdown: raw, unicode: converted, literal: preserved }
        : { unicode: raw, markdown: converted, literal: preserved },
    );
  };
  let position = 0;
  for (const { start, end, value } of changes) {
    append(
      source.slice(position, start),
      source.slice(position, start),
      literal,
    );
    append(source.slice(start, end), value);
    position = end;
  }
  append(source.slice(position), source.slice(position), literal);
  return pieces;
}

export function convert(source: string, mode: Mode) {
  const target = mode === 'markdown' ? 'unicode' : 'markdown';
  return project(source, mode)
    .map((part) => part[target])
    .join('');
}
