// SPDX-License-Identifier: GPL-3.0-only
import './style.css';
import {
  Document,
  bulletLines,
  formatSelection,
  formatTyping,
  selectionStyles,
  type Replacement,
} from './document.ts';
import { analyze, limits, measureLimit, type Warning } from './analysis.ts';
import {
  explanation,
  help,
  localize,
  type Help,
  type Key,
  type Locale,
} from './i18n.ts';
import { inspectMarkdown } from './markdown.ts';
import { graphemes, type Mode, type Style } from './unicode.ts';
import { installTooltips } from './tooltip.ts';
import { version } from '../package.json';

const get = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const editor = get<HTMLTextAreaElement>('editor');
const output = get<HTMLSelectElement>('output');
const destination = get<HTMLSelectElement>('destination');
const sourceLink = get<HTMLAnchorElement>('limit-source');
const hint = get('hint');
const gutter = get('gutter');
const lineMarkers = get('line-markers');
const diagnostics = get('diagnostics');
const helpDialog = get<HTMLDialogElement>('help-dialog');
const clearDialog = get<HTMLDialogElement>('clear-dialog');
const clipboardDialog = get<HTMLDialogElement>('clipboard-dialog');
const doc = new Document();
const armed = new Set<Style>();
const modes = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
const formats = document.querySelectorAll<HTMLButtonElement>('[data-style]');
const selection = () => ({
  start: editor.selectionStart,
  end: editor.selectionEnd,
});
let locale: Locale = navigator.language.toLowerCase().startsWith('de')
  ? 'de'
  : 'en';
let timer = 0;
let composing = false;
let notice: Key | undefined;
let noticeValues: Record<string, string> | undefined;
let lastAnalysis:
  | { source: string; locale: Locale; result: ReturnType<typeof analyze> }
  | undefined;
const t = (key: Key, values?: Record<string, string>) =>
  localize(locale, key, values);
const dismissTooltip = installTooltips(get('tooltip'), () => locale);
const number = (value: number) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);

function setNotice(key?: Key, values?: Record<string, string>) {
  notice = key;
  noticeValues = values;
  hint.textContent = key ? t(key, values) : '';
}
function translate() {
  document.documentElement.lang = locale;
  get<HTMLSelectElement>('language').value = locale;
  for (const node of document.querySelectorAll<HTMLElement>(
    '[data-i], [data-name]',
  )) {
    if (node.dataset.i) node.textContent = t(node.dataset.i as Key);
    if (node.dataset.name)
      node.setAttribute('aria-label', t(node.dataset.name as Key));
  }
  editor.placeholder = t('placeholder');
  setNotice(notice, noticeValues);
  dismissTooltip();
}

function formatName(mode: Mode) {
  return mode === 'markdown' ? 'Markdown' : 'Unicode';
}

function renderDiagnostics(warnings: Warning[]) {
  diagnostics.hidden = warnings.length === 0;
  get('warning-count').textContent = '(' + number(warnings.length) + ')';
  const current = doc.frame;
  const lines = current.text.split('\n');
  const exact = current.mode === 'markdown';
  const flagged = new Set(exact ? warnings.map(({ line }) => line) : []);
  const list = get('warning-list');
  if (list.contains(document.activeElement))
    diagnostics.querySelector('summary')?.focus();
  list.replaceChildren(
    ...warnings.map(({ line, offset, key }) => {
      const item = document.createElement('li');
      const text = t('line', { line: number(line) }) + ' · ' + t(key);
      if (exact) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.dataset.help = 'diagnosticLine';
        button.addEventListener('click', () => {
          editor.focus();
          editor.setSelectionRange(offset, offset);
          editor.scrollTop =
            (line - 1) * parseFloat(getComputedStyle(editor).lineHeight);
        });
        item.append(button);
      } else {
        item.textContent = 'Markdown · ' + text;
      }
      return item;
    }),
  );
  if (lines.length > 1600) {
    lineMarkers.replaceChildren();
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const [index, line] of lines.entries()) {
    const row = document.createElement('div');
    const marker = document.createElement('span');
    marker.className = flagged.has(index + 1) ? 'marker flagged' : 'marker';
    marker.textContent = flagged.has(index + 1) ? '!' : String(index + 1);
    row.append(marker, line || '\u00a0');
    fragment.append(row);
  }
  lineMarkers.replaceChildren(fragment);
  gutter.scrollTop = editor.scrollTop;
}

function renderAnalysis() {
  const source = doc.output('markdown');
  const outputMode = output.value as Mode;
  const chosen = outputMode === 'markdown' ? source : doc.output('unicode');
  const target = limits[destination.value as keyof typeof limits];
  const units = t('units', { format: formatName(outputMode) });
  const limit = get('limit');
  if (target) {
    const { used, remaining, state } = measureLimit(chosen, target.max);
    const summary =
      remaining < 0
        ? t('over', { count: number(-remaining) })
        : t('remaining', { count: number(remaining) });
    limit.textContent =
      number(used) +
      ' / ' +
      number(target.max) +
      ' · ' +
      summary +
      ' · ' +
      units +
      ' · ' +
      t(target.evidence) +
      (state === 'near' ? ' · ' + t('near') : '');
    limit.dataset.state = state;
    sourceLink.href = target.source;
    sourceLink.hidden = false;
  } else {
    limit.textContent = t('genericLength', {
      count: number(chosen.length),
      units,
    });
    limit.dataset.state = 'within';
    sourceLink.hidden = true;
  }
  if (lastAnalysis?.source !== source || lastAnalysis.locale !== locale) {
    lastAnalysis = { source, locale, result: analyze(source, locale) };
  }
  const stats = lastAnalysis.result;
  for (const key of ['words', 'paragraphs', 'average', 'median'] as const) {
    const value = stats[key];
    get(key).textContent = value === undefined ? '—' : number(value);
  }
  // Character count reflects what the user sees in the sole editor.
  get('characters').textContent = number(
    doc.frame.mode === 'markdown'
      ? stats.characters
      : Array.from(graphemes(doc.frame.text)).length,
  );
  renderDiagnostics(stats.warnings);
  get('literal-notice').hidden =
    outputMode !== 'unicode' || !inspectMarkdown(source).literal;
}
function scheduleAnalysis() {
  clearTimeout(timer);
  timer = window.setTimeout(
    renderAnalysis,
    doc.frame.text.length > 10_000 ? 360 : 140,
  );
}
function renderControls() {
  for (const button of modes)
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.mode === doc.frame.mode),
    );
  const selected =
    doc.frame.end - doc.frame.start < 10_000 ? selectionStyles(doc.frame) : [];
  for (const button of formats) {
    const style = button.dataset.style as Style;
    button.setAttribute(
      'aria-pressed',
      String(
        doc.frame.start === doc.frame.end
          ? armed.has(style)
          : selected.includes(style),
      ),
    );
  }
  get('undo').setAttribute('aria-disabled', String(!doc.canUndo));
  get('redo').setAttribute('aria-disabled', String(!doc.canRedo));
}
function renderEditor(focus = false) {
  const scroll = editor.scrollTop;
  const frame = doc.frame;
  if (editor.value !== frame.text) editor.value = frame.text;
  if (focus) editor.focus({ preventScroll: true });
  editor.setSelectionRange(frame.start, frame.end);
  editor.scrollTop = scroll;
  renderControls();
  scheduleAnalysis();
}
function replace(change: Replacement, selectResult: boolean, kind = '') {
  const text =
    editor.value.slice(0, change.start) +
    change.value +
    editor.value.slice(change.end);
  const end = change.caret ?? change.start + change.value.length;
  doc.edit(text, { start: selectResult ? change.start : end, end }, kind);
  renderEditor(true);
}
function toggle(style: Style) {
  doc.select(selection());
  doc.endGroup();
  if (editor.selectionStart === editor.selectionEnd) {
    const frame = doc.frame;
    if (armed.has(style)) {
      // Leave any existing Markdown closing delimiters before continuing.
      if (frame.mode === 'markdown') {
        const last = inspectMarkdown(frame.text).changes.find(
          (part) => part.start < frame.end && part.end > frame.end,
        );
        if (
          last &&
          /^(?:[*~_]+|<\/u>)+$/u.test(frame.text.slice(frame.end, last.end))
        ) {
          doc.select({ start: last.end, end: last.end });
        }
      }
      armed.delete(style);
    } else armed.add(style);
    renderEditor(true);
    return;
  }
  const patch = formatSelection(doc.frame, style);
  if (patch) replace(patch, true);
  else setNotice('protected');
}
function history(direction: 'undo' | 'redo') {
  doc.select(selection());
  if (doc[direction]()) renderEditor(true);
}

editor.addEventListener('beforeinput', (event) => {
  if (event.isComposing || composing) return;
  const kind = event.inputType;
  doc.select(selection());
  if (kind === 'historyUndo' || kind === 'historyRedo') {
    event.preventDefault();
    history(kind === 'historyUndo' ? 'undo' : 'redo');
  } else if (
    event.cancelable &&
    armed.size &&
    (kind === 'insertText' || kind === 'insertLineBreak')
  ) {
    event.preventDefault();
    replace(
      formatTyping(
        doc.frame,
        kind === 'insertLineBreak' ? '\n' : (event.data ?? ''),
        armed,
      ),
      false,
      kind,
    );
  }
});
editor.addEventListener('input', (event) => {
  if (composing) return;
  const kind = (event as InputEvent).inputType;
  doc.edit(
    editor.value,
    selection(),
    /^(insertText|deleteContentBackward|deleteContentForward)$/u.test(kind)
      ? kind
      : '',
  );
  setNotice();
  renderControls();
  scheduleAnalysis();
});
editor.addEventListener('compositionstart', () => {
  composing = true;
  doc.select(selection());
  doc.endGroup();
});
editor.addEventListener('compositionend', () => {
  composing = false;
  doc.edit(editor.value, selection());
  renderControls();
  scheduleAnalysis();
});
editor.addEventListener('scroll', () => {
  gutter.scrollTop = editor.scrollTop;
});
editor.addEventListener('pointerdown', () => {
  doc.endGroup();
});
editor.addEventListener('select', () => {
  if (composing) return;
  doc.select(selection());
  renderControls();
});
editor.addEventListener('keydown', (event) => {
  if (event.isComposing || (!event.ctrlKey && !event.metaKey) || event.altKey)
    return;
  const key = event.key.toLowerCase();
  if (key === 'b' || key === 'i') {
    event.preventDefault();
    toggle(key === 'b' ? 'bold' : 'italic');
  }
  if (key === 'z' || key === 'y') {
    event.preventDefault();
    history(key === 'y' || event.shiftKey ? 'redo' : 'undo');
  }
});

for (const button of formats)
  button.addEventListener('click', () => {
    toggle(button.dataset.style as Style);
  });
for (const button of modes)
  button.addEventListener('click', () => {
    if (button.dataset.mode === doc.frame.mode) return;
    doc.select(selection());
    doc.switchTo(button.dataset.mode as Mode);
    setNotice(
      doc.frame.mode === 'unicode' &&
        inspectMarkdown(doc.output('markdown')).literal
        ? 'literal'
        : undefined,
    );
    renderEditor(true);
  });
get('bullets').addEventListener('click', () => {
  doc.select(selection());
  replace(
    bulletLines(doc.frame),
    editor.selectionStart !== editor.selectionEnd,
  );
});
get('undo').addEventListener('click', () => {
  history('undo');
});
get('redo').addEventListener('click', () => {
  history('redo');
});
output.addEventListener('change', () => {
  setNotice(
    output.value === 'unicode' &&
      inspectMarkdown(doc.output('markdown')).literal
      ? 'literal'
      : undefined,
  );
  renderAnalysis();
});
destination.addEventListener('change', renderAnalysis);
sourceLink.target = '_blank';
sourceLink.rel = 'noopener noreferrer';
get<HTMLSelectElement>('theme').addEventListener('change', (event) => {
  document.documentElement.dataset.theme = (
    event.currentTarget as HTMLSelectElement
  ).value;
});
get<HTMLSelectElement>('language').addEventListener('change', (event) => {
  locale = (event.currentTarget as HTMLSelectElement).value as Locale;
  translate();
  renderAnalysis();
});
get('copy').addEventListener('click', () => {
  const mode = output.value as Mode;
  const text = doc.output(mode);
  void (async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('copied', { format: formatName(mode) });
    } catch {
      const manual = get('manual-output');
      manual.textContent = text;
      clipboardDialog.showModal();
      manual.focus();
      const range = document.createRange();
      range.selectNodeContents(manual);
      const selected = window.getSelection();
      selected?.removeAllRanges();
      selected?.addRange(range);
    }
  })();
});
get('save').addEventListener('click', () => {
  const mode = output.value as Mode;
  const url = URL.createObjectURL(
    new Blob([doc.output(mode)], { type: 'text/plain;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'boldemort-draft.' + (mode === 'markdown' ? 'md' : 'txt');
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  setNotice('exported');
});
get('clear').addEventListener('click', () => {
  if (editor.value) clearDialog.showModal();
});
clearDialog.addEventListener('close', () => {
  if (clearDialog.returnValue === 'clear') {
    clearDialog.returnValue = '';
    armed.clear();
    doc.edit('', { start: 0, end: 0 });
    setNotice();
    renderEditor(true);
  }
});
get('help').addEventListener('click', () => {
  const entries = Object.keys(help).flatMap((key) => {
    const entry = explanation(locale, key as Help);
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = entry.short;
    detail.textContent = entry.long;
    return [term, detail];
  });
  get('help-list').replaceChildren(...entries);
  helpDialog.showModal();
});
get('version').textContent = 'v' + version;
editor.value = '';
translate();
renderAnalysis();
