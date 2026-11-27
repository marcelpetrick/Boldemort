// SPDX-License-Identifier: GPL-3.0-or-later
import { parse } from './markdown.ts';
import { decode, graphemes, needsUnicodeDecoding } from './unicode.ts';

type Node =
  | ReturnType<typeof parse>['children'][number]
  | import('mdast').PhrasingContent;
export type Warning = {
  line: number;
  offset: number;
  key: 'fence' | 'table' | 'longParagraph';
};

function prose(node: Node): string {
  if ('children' in node) {
    const separator = [
      'table',
      'tableRow',
      'list',
      'listItem',
      'blockquote',
    ].includes(node.type)
      ? ' '
      : '';
    return node.children.map(prose).join(separator);
  }
  // The parser always records image text, even when it is empty.
  if ('alt' in node) return node.alt!;
  if ('value' in node && node.type !== 'html') return node.value;
  return node.type === 'break' ? '\n' : '';
}

export function analyze(source: string, locale: string) {
  const tree = parse(source);
  const warnings: Warning[] = [];
  // Every node from the parser carries its source position.
  const report = (node: Node, key: Warning['key']) => {
    const { line, offset } = node.position!.start;
    warnings.push({ line, offset: offset!, key });
  };
  function diagnostics(node: Node) {
    if (node.type === 'code') {
      const { start, end } = node.position!;
      const raw = source.slice(start.offset, end.offset);
      // Fenced nodes start at the marker. Indented code starts at its indent.
      if (raw.startsWith('`') || raw.startsWith('~')) {
        const lines = raw.split(/\r\n?|\n/u);
        const endsWithFence = /^[ \t>]*(?:`{3,}|~{3,})[ \t]*$/u.test(
          lines.at(-1)!,
        );
        // Parsed code includes a fence-looking final line only when it is code
        // content. A real closer contributes its own source line.
        const contentReachesEnd =
          node.value !== '' &&
          node.value.split(/\r\n?|\n/u).length >= lines.length - 1;
        if (lines.length < 2 || !endsWithFence || contentReachesEnd)
          report(node, 'fence');
      }
    }
    if (node.type === 'table') {
      const [header, ...rows] = node.children;
      const width = header!.children.length;
      for (const row of rows) {
        if (row.children.length !== width) report(row, 'table');
      }
    }
    if (node.type === 'paragraph' && prose(node).length > 1600)
      report(node, 'longParagraph');
    if ('children' in node)
      for (const child of node.children) diagnostics(child);
  }
  for (const child of tree.children) diagnostics(child);
  const paragraphs = tree.children.map(prose).filter((text) => text.trim());
  const body = paragraphs.join('\n\n');
  const plain = needsUnicodeDecoding.test(body)
    ? Array.from(graphemes(body), ({ segment }) => {
        const { base, tail } = decode(segment);
        return base + tail;
      }).join('')
    : body;
  const wordCount = (text: string) => {
    if (typeof Intl.Segmenter !== 'function')
      return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
    let count = 0;
    for (const word of wordSegmenter!.segment(text))
      if (word.isWordLike) count++;
    return count;
  };
  const wordSegmenter =
    typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(locale, { granularity: 'word' })
      : undefined;
  const sentences =
    typeof Intl.Segmenter === 'function'
      ? Array.from(
          new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(
            plain,
          ),
          (item) => item.segment,
        )
      : plain.split(/[.!?。！？]+(?:\s+|$)/u);
  const counts = sentences
    .map(wordCount)
    .filter(Boolean)
    .sort((a, b) => a - b);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const middle = Math.floor(counts.length / 2);
  const characters = Array.from(graphemes(source)).length;
  return {
    words: wordCount(plain),
    characters,
    paragraphs: paragraphs.length,
    sentences: counts.length,
    average: counts.length ? total / counts.length : undefined,
    median: counts.length
      ? (counts[middle]! + counts[Math.floor((counts.length - 1) / 2)]!) / 2
      : undefined,
    warnings,
  };
}

const postHelp = 'https://www.linkedin.com/help/linkedin/answer/a522483';
export const limits = {
  post: {
    max: 3000,
    source: postHelp,
    reviewed: '2026-11-19',
    evidence: 'official',
  },
  article: {
    max: 125000,
    source: postHelp,
    reviewed: '2026-11-19',
    evidence: 'official',
  },
  message: {
    max: 8000,
    source: 'https://www.linkedhelper.com/blog/linkedin-character-limit',
    reviewed: '2026-11-19',
    evidence: 'reported',
  },
  inmail: {
    max: 1900,
    source: 'https://www.linkedin.com/help/linkedin/answer/a411986',
    reviewed: '2026-11-19',
    evidence: 'conservative',
  },
  note: {
    max: 200,
    source: 'https://www.linkedin.com/help/linkedin/answer/a563153',
    reviewed: '2026-11-19',
    evidence: 'official',
  },
} as const;

export function measureLimit(output: string, maximum: number) {
  const used = output.length;
  return {
    used,
    remaining: maximum - used,
    state: used > maximum ? 'over' : used >= maximum * 0.9 ? 'near' : 'within',
  } as const;
}
