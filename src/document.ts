// SPDX-License-Identifier: GPL-3.0-or-later
import { inspectMarkdown, project, type Projection } from './markdown.ts';
import {
  decode,
  defaultLineStyles,
  graphemes,
  hasRandomFont,
  randomizeUnicode,
  styleUnicode,
  styles,
  wrapMarkdown,
  type Mode,
  type Style,
} from './unicode.ts';

type Pending = { mode: Mode; text: string };
type Piece = Projection | Pending;
type Selection = { start: number; end: number };
export type Frame = Selection & { text: string; mode: Mode };
type State = Frame & { pieces: Piece[] };

function changedRange(previous: string, next: string) {
  let start = 0;
  let end = previous.length;
  let nextEnd = next.length;
  while (start < end && start < nextEnd && previous[start] === next[start])
    start++;
  // Keep UTF-16 surrogate pairs together at edit boundaries.
  if (
    /[\udc00-\udfff]/u.test(previous[start] ?? '') ||
    /[\udc00-\udfff]/u.test(next[start] ?? '')
  )
    start--;
  start = Math.max(0, start);
  while (
    end > start &&
    nextEnd > start &&
    previous[end - 1] === next[nextEnd - 1]
  ) {
    end--;
    nextEnd--;
  }
  if (
    /[\udc00-\udfff]/u.test(previous[end] ?? '') ||
    /[\udc00-\udfff]/u.test(next[nextEnd] ?? '')
  ) {
    end++;
    nextEnd++;
  }
  return { start, end, value: next.slice(start, nextEnd) };
}

export class Document {
  lineStyles = { ...defaultLineStyles };
  #state: State = { mode: 'unicode', text: '', start: 0, end: 0, pieces: [] };
  #undo: State[] = [];
  #redo: State[] = [];
  #editedAt = 0;
  #editKind = '';

  get frame(): Frame {
    return this.#state;
  }
  get canUndo() {
    return this.#undo.length > 0;
  }
  get canRedo() {
    return this.#redo.length > 0;
  }
  select(selection: Selection) {
    this.#state = { ...this.#state, ...selection };
  }
  #record(kind: string) {
    const now = Date.now();
    if (!kind || kind !== this.#editKind || now - this.#editedAt > 750) {
      this.#undo.push(this.#state);
      // Keep a bounded recoverable history, including for very long documents.
      if (this.#undo.length > 100) this.#undo.shift();
    }
    this.#redo = [];
    this.#editedAt = now;
    this.#editKind = kind;
  }
  endGroup() {
    this.#editKind = '';
  }
  edit(text: string, selection: Selection, kind = '') {
    const before = this.#state;
    if (text === before.text) {
      this.select(selection);
      return;
    }
    this.#record(kind);
    if (!before.pieces.some((piece) => !('text' in piece))) {
      this.#state = {
        ...before,
        ...selection,
        text,
        pieces: [{ mode: before.mode, text }],
      };
      return;
    }
    const { start, end, value } = changedRange(before.text, text);
    const pieces: Piece[] = [];
    const mode = before.mode;
    function addPending(raw: string) {
      if (!raw) return;
      const previous = pieces.at(-1);
      if (previous && 'text' in previous)
        pieces[pieces.length - 1] = { mode, text: previous.text + raw };
      else pieces.push({ mode, text: raw });
    }
    let offset = 0;
    let inserted = false;
    for (const piece of before.pieces) {
      const raw = 'text' in piece ? piece.text : piece[mode];
      const limit = offset + raw.length;
      if (limit <= start || offset >= end) {
        if (!inserted && offset >= end) {
          addPending(value);
          inserted = true;
        }
        pieces.push(piece);
      } else {
        addPending(raw.slice(0, Math.max(0, start - offset)));
        if (!inserted) {
          addPending(value);
          inserted = true;
        }
        if (limit > end) addPending(raw.slice(end - offset));
      }
      offset = limit;
    }
    if (!inserted) addPending(value);
    this.#state = { mode, text, ...selection, pieces };
  }
  output(mode: Mode) {
    if (mode === this.#state.mode) return this.#state.text;
    return this.#projection()
      .map((piece) => piece[mode])
      .join('');
  }
  #projection(): Projection[] {
    const { pieces, mode, text } = this.#state;
    if (pieces.every((piece): piece is Projection => !('text' in piece)))
      return pieces;
    // Parse the entire current representation so newly inserted syntax can
    // change the meaning of an adjacent span. Reuse a prior spelling when
    // the parser still recognizes the same span as a conversion.
    const remembered = new Map<number, Projection>();
    let offset = 0;
    for (const piece of pieces) {
      if ('text' in piece) {
        offset += piece.text.length;
      } else {
        if (piece.markdown !== piece.unicode) remembered.set(offset, piece);
        offset += piece[mode].length;
      }
    }
    offset = 0;
    return project(text, mode, this.lineStyles).map((piece) => {
      const original = remembered.get(offset);
      offset += piece[mode].length;
      return piece.markdown !== piece.unicode &&
        original?.[mode] === piece[mode]
        ? original
        : piece;
    });
  }
  switchTo(mode: Mode) {
    const before = this.#state;
    if (before.mode === mode) return;
    const pieces = this.#projection();
    function map(position: number) {
      let input = 0;
      let output = 0;
      for (const piece of pieces) {
        const oldLength = piece[before.mode].length;
        const newLength = piece[mode].length;
        const local = position - input;
        if (local <= oldLength) {
          // Interpolate only at grapheme boundaries in transformed spans.
          if (piece[before.mode] === piece[mode]) return output + local;
          const boundaries = [...graphemes(piece[mode])]
            .map(({ index }) => index)
            .concat(newLength);
          const estimate = (newLength * local) / oldLength;
          return (
            output +
            boundaries.reduce(
              (best, next) =>
                Math.abs(next - estimate) < Math.abs(best - estimate)
                  ? next
                  : best,
              0,
            )
          );
        }
        input += oldLength;
        output += newLength;
      }
      return output;
    }
    this.#record('');
    this.#state = {
      mode,
      pieces,
      text: pieces.map((piece) => piece[mode]).join(''),
      start: map(before.start),
      end: map(before.end),
    };
  }
  undo() {
    const state = this.#undo.pop();
    if (!state) return false;
    this.#redo.push(this.#state);
    this.#state = state;
    this.endGroup();
    return true;
  }
  redo() {
    const state = this.#redo.pop();
    if (!state) return false;
    this.#undo.push(this.#state);
    this.#state = state;
    this.endGroup();
    return true;
  }
}

export type Replacement = Selection & {
  value: string;
  caret?: number;
  preservedSyntax?: boolean;
};

function editableGlyphs(ranges: Selection[], offset: number) {
  let current = 0;
  return (start: number, end: number) => {
    while (ranges[current] && ranges[current]!.end <= start + offset) current++;
    return !ranges[current] || ranges[current]!.start >= end + offset;
  };
}

export function randomSelectionActive({ text, start, end, mode }: Frame) {
  return (
    mode === 'unicode' &&
    start < end &&
    hasRandomFont(
      text.slice(start, end),
      editableGlyphs(inspectMarkdown(text).protectedRanges, start),
    )
  );
}

function markdownStyles(raw: string) {
  const active = new Set<Style>();
  if (raw.startsWith('<u>')) active.add('underline');
  const inner = raw.replace(/^<u>|<\/u>$/gu, '');
  if (inner.startsWith('~')) active.add('strike');
  const marker =
    inner.replace(/^~{1,2}/u, '').match(/^[*_]{1,3}/u)?.[0].length ?? 0;
  if (marker > 1) active.add('bold');
  if (marker % 2) active.add('italic');
  return active;
}

function formatMarkdownDraft(
  text: string,
  style: Style,
  analysis: ReturnType<typeof inspectMarkdown>,
): Replacement | undefined {
  const spans = [];
  for (const range of analysis.plainRanges) {
    for (const line of text
      .slice(range.start, range.end)
      .matchAll(/[^\r\n]+/gu)) {
      const raw = line[0];
      const body = raw.trim();
      if (!body || /[*_~<>\\]/u.test(body)) continue;
      if (
        (style === 'bold' || style === 'italic') &&
        !/[\p{L}\p{N}]/u.test(body)
      )
        continue;
      const start = range.start + line.index + raw.indexOf(body);
      spans.push({
        start,
        end: start + body.length,
        body,
        active: new Set<Style>(),
      });
    }
  }
  for (const range of analysis.changes) {
    const raw = text.slice(range.start, range.end);
    const active = markdownStyles(raw);
    if (!active.size) continue;
    const body = raw
      .replace(/^<u>|<\/u>$/gu, '')
      .replace(/^[*_~]+|[*_~]+$/gu, '');
    if (!body || /[*_~<>\r\n]/u.test(body)) continue;
    spans.push({ ...range, body, active });
  }
  if (!spans.length) return;
  const remove = spans.every(({ active }) => active.has(style));
  spans.sort((a, b) => a.start - b.start);
  const edits: typeof spans = [];
  for (const span of spans) {
    if (remove) span.active.delete(style);
    else span.active.add(style);
    const previous = edits.at(-1);
    if (
      previous?.end === span.start &&
      styles.every((key) => previous.active.has(key) === span.active.has(key))
    ) {
      previous.body += span.body;
      previous.end = span.end;
    } else edits.push(span);
  }
  let offset = 0;
  let value = '';
  for (const edit of edits) {
    value +=
      text.slice(offset, edit.start) + wrapMarkdown(edit.body, edit.active);
    offset = edit.end;
  }
  return {
    start: 0,
    end: text.length,
    value: value + text.slice(offset),
    preservedSyntax: analysis.literal,
  };
}

export function formatSelection(
  frame: Frame,
  style: Style | 'random',
  lineStyles = defaultLineStyles,
): Replacement | undefined {
  const { text, mode } = frame;
  let { start, end } = frame;
  const analysis = inspectMarkdown(text);
  if (mode === 'unicode') {
    for (const { segment, index } of graphemes(text)) {
      if (index > end) break;
      if (index < start && index + segment.length > start) start = index;
      if (index < end && index + segment.length > end)
        end = index + segment.length;
    }
    const source = text.slice(start, end);
    const protectedRanges = analysis.protectedRanges.filter(
      (range) => range.start < end && range.end > start,
    );
    const editable = editableGlyphs(protectedRanges, start);
    const value =
      style === 'random'
        ? randomizeUnicode(source, Math.random, editable, true)
        : styleUnicode(source, [style], true, lineStyles, editable);
    if (protectedRanges.length && source === value) return;
    return protectedRanges.length
      ? { start, end, value, preservedSyntax: true }
      : { start, end, value };
  }
  if (style === 'random') return;
  const overlapsProtected = analysis.protectedRanges.some(
    (range) => range.start < end && range.end > start,
  );
  if (
    start === 0 &&
    end === text.length &&
    (overlapsProtected ||
      /[\r\n]/u.test(text) ||
      (analysis.formattingRanges.some(
        (part) => part.start > start || part.end < end,
      ) &&
        !analysis.formattingRanges.some(
          (part) => part.start === start && part.end === end,
        )))
  )
    return formatMarkdownDraft(text, style, analysis);
  if (overlapsProtected) return;
  const selection = text.slice(start, end);
  if (!selection.trim()) return;
  const left = selection.length - selection.trimStart().length;
  const right = selection.trimEnd().length;
  start += left;
  end = frame.start + right;
  const containing = analysis.changes.find(
    (part) => part.start < end && part.end > start,
  );
  if (containing) {
    const raw = text.slice(containing.start, containing.end);
    const body = raw
      .replace(/^<u>|<\/u>$/gu, '')
      .replace(/^[*_~]+|[*_~]+$/gu, '');
    const bodyStart = containing.start + raw.indexOf(body);
    if (start > bodyStart || end < bodyStart + body.length) return;
    if (start < containing.start || end > containing.end) return;
    const active = markdownStyles(raw);
    // Rewriting a heavily nested span to a single style would discard its
    // internal delimiters. Leave that selection untouched.
    if (/[*_~<>]/u.test(body)) return;
    if (active.has(style)) active.delete(style);
    else active.add(style);
    return {
      start: containing.start,
      end: containing.end,
      value: wrapMarkdown(body, active),
    };
  }
  const raw = text.slice(start, end);
  if (/[*_~<>\r\n]/u.test(raw)) return;
  return { start, end, value: wrapMarkdown(raw, new Set([style])) };
}

export function formatTyping(
  frame: Frame,
  input: string,
  active: ReadonlySet<Style>,
  lineStyles = defaultLineStyles,
  randomFont = false,
): Replacement {
  const { text, start, end, mode } = frame;
  // Avoid parsing a long prose draft on each keystroke when it has no markup.
  const { formattingRanges, protectedRanges } =
    /[`~#<>[\]!*_|:]|^(?: {4}|\t)|^ {0,3}(?:[-+>]|\d+[.)])[ \t]/mu.test(text)
      ? inspectMarkdown(text)
      : { formattingRanges: [], protectedRanges: [] };
  if (
    protectedRanges.some((range) => start > range.start && start < range.end)
  ) {
    return { start, end, value: input };
  }
  if (mode === 'unicode') {
    const styled = styleUnicode(input, active, false, lineStyles);
    return {
      start,
      end,
      value: randomFont ? randomizeUnicode(styled) : styled,
    };
  }
  const open = wrapMarkdown('\0', active).split('\0');
  const prefix = open[0]!;
  const suffix = open[1]!;
  function matchesSpan(part: (typeof formattingRanges)[number]) {
    const raw = text.slice(part.start, part.end);
    if (!raw.startsWith(prefix) || !raw.endsWith(suffix)) return false;
    // The delimiter run for ***bold italic*** also starts and ends with **.
    // Only move the closing delimiter if its run matches the armed wrapper.
    const marker = suffix[0];
    const closing = raw.length - suffix.length;
    return (
      !marker ||
      !'*~'.includes(marker) ||
      (raw[prefix.length] !== marker && raw[closing - 1] !== marker)
    );
  }
  if (start === end) {
    const inside = formattingRanges.find(
      (part) =>
        start >= part.start + prefix.length &&
        end <= part.end - suffix.length &&
        matchesSpan(part),
    );
    if (inside) {
      if (!input.trim()) {
        // Whitespace against an opening or closing marker invalidates it.
        if (start === inside.start + prefix.length)
          return { start: inside.start, end: inside.start, value: input };
        if (end === inside.end - suffix.length)
          return { start: inside.end, end: inside.end, value: input };
      }
      return { start, end, value: input };
    }
  }
  if (!input.trim()) return { start, end, value: input };
  const leading = input.match(/^\s*/u)![0];
  const trailing = input.match(/\s*$/u)![0];
  if (start === end) {
    if (
      formattingRanges.some((part) => part.start === start && matchesSpan(part))
    ) {
      return {
        start,
        end: start + prefix.length,
        value: leading + prefix + input.trimStart(),
      };
    }
    const gap = /[ \t]+$/u.exec(text.slice(0, start))?.[0];
    const previousEnd = start - (gap?.length ?? 0);
    if (
      gap &&
      formattingRanges.some(
        (part) => part.end === previousEnd && matchesSpan(part),
      )
    ) {
      const closing = previousEnd - suffix.length;
      const body = gap + leading + input.trim();
      return {
        start: closing,
        end,
        value: body + suffix + trailing,
        caret: closing + body.length,
      };
    }
  }
  const value = leading + prefix + input.trim() + suffix + trailing;
  return {
    start,
    end,
    value,
    caret: start + value.length - suffix.length - trailing.length,
  };
}

export function bulletLines(frame: Frame): Replacement {
  const { text, mode } = frame;
  const start =
    frame.start === 0 ? 0 : text.lastIndexOf('\n', frame.start - 1) + 1;
  const next = text.indexOf(
    '\n',
    Math.max(
      start,
      frame.end > frame.start && text[frame.end - 1] === '\n'
        ? frame.end - 1
        : frame.end,
    ),
  );
  const end = next === -1 ? text.length : next;
  if (
    inspectMarkdown(text).protectedRanges.some(
      (range) =>
        range.start < end &&
        range.end > start &&
        /^(?: {4}[^ ]|\t|\s*[`~]{3})/u.test(text.slice(range.start, range.end)),
    )
  ) {
    return { start, end, value: text.slice(start, end) };
  }
  const lines = text.slice(start, end).split('\n');
  const bullet = /^([ \t]*)[-+*•](?![ \t]+\[[ xX]\])(?:[ \t]+|$)/u;
  const structured = /^\s*(?:\d+[.)][ \t]|[-+*][ \t]+\[[ xX]\])/u;
  const remove = lines.every((line) => bullet.test(line));
  const value = lines
    .map((line) => {
      if (remove) return line.replace(bullet, '$1');
      if (bullet.test(line) || structured.test(line)) return line;
      return line.replace(
        /^[ \t]*/u,
        '$&' + (mode === 'markdown' ? '- ' : '• '),
      );
    })
    .join('\n');
  return { start, end, value };
}

export function selectionStyles(frame: Frame) {
  const selected = frame.text.slice(frame.start, frame.end);
  if (!selected) return [];
  if (frame.mode === 'markdown') {
    const part = inspectMarkdown(frame.text).changes.find(
      ({ start, end }) => start <= frame.start && end >= frame.end,
    );
    if (!part) return [];
    return selectedStyles(part.value);
  }
  return selectedStyles(selected);
}

function selectedStyles(text: string) {
  const glyphs = Array.from(graphemes(text.trim()), ({ segment }) =>
    decode(segment),
  ).filter(({ base }) => /\S/u.test(base));
  return styles.filter(
    (style) =>
      glyphs.length > 0 && glyphs.every(({ active }) => active.has(style)),
  );
}
