# How Boldemort works

The [product vision](../vision.md) sets the requirements. The
[implementation plan](PLAN.md) records the work in order.

## Editor and output

- One textarea shows the same draft in Markdown or Unicode. The browser keeps
  the draft and editing history in memory for the current tab.
- The GFM parser records where elements begin and end in the Markdown source.
  Simple unordered lists become Unicode bullets. Nested lists, task lists,
  and other complex structures keep their original Markdown. Nested,
  ordered, and multi-line lists keep only their markers literal, so their
  item text can still be formatted. Task lists stay fully protected. After editing,
  the parser reads the whole draft so changed syntax can affect nearby text.
  The editor reuses the original spelling for conversion spans it still
  recognizes.
- Regular Unicode styling uses mathematical serif letters. The default line
  marks are short strikethrough and double macron below. Changing a line style
  affects new formatting. Pasted text and unchanged round-trips keep their
  original marks.
- Text containing `<`, `>`, `*`, `_`, or `~` is formatted only when the
  parser reads the result as one styled span with the same text. Otherwise
  it stays as written and the editor says so.
- Unicode to Markdown conversion continues a styled run across characters
  that have no styled glyph, such as punctuation and accented letters, but
  never across a line break. When such a run joins spans with remembered
  Markdown spelling, each remembered span keeps its spelling.
- Coverage must be complete for lines, statements, branches, and functions.
  Code that the parser or earlier checks make unreachable is removed rather
  than excluded from coverage, and each remaining branch has a test.
- Formatting shortcuts follow Word and Google Docs: Ctrl or Cmd with B, I,
  U, Shift+X for strikethrough, and Shift+8 for bullets. They apply only
  while the draft has focus, so Ctrl+U opens page source everywhere else.
  The bullet shortcut uses the physical 8 key to work on German layouts.
  Mode switching and Copy all have no shortcut because the obvious keys
  belong to browser developer tools.
- English and German are available with System, Light, Dark, and Bavarian
  themes. Settings last for the current tab. The Help dialog makes the full
  tooltips available on touch devices.
- LinkedIn estimates use UTF-16 units from the selected output. The app warns
  at 90% and labels the source of each limit. Writing statistics use the
  parsed content, and the visible character count uses Unicode graphemes.

## Build and delivery

- Vite builds the TypeScript editor as a static site for GitHub Pages. Browser
  coverage uses a separate build, and mutation testing uses a sandbox copy.
- CI uses the Node.js 24 LTS line and pins an exact patch version. TypeScript
  stays at 6.0.3 while the TypeScript ESLint peer range requires a version
  below 6.1.
- The project follows the
  [DarkFactory workflow](https://github.com/marcelpetrick/DarkFactory) and uses
  GPL-3.0-or-later. The app and README credit Marcel Petrick
  (<mail@marcelpetrick.it>) and disclose AI assistance.
