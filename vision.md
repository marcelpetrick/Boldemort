# Boldemort product vision

<!-- markdownlint-configure-file { "MD013": { "tables": false } } -->

This is the product brief for [Boldemort](https://marcelpetrick.github.io/Boldemort/).
The project uses GPL-3.0-or-later and credits Marcel Petrick
(<mail@marcelpetrick.it>) and AI assistance.

---

## 1. Vision

**Write one draft. Add emphasis. Copy it as Markdown or styled Unicode.**
Boldemort helps people write LinkedIn posts and plain-text messages.
Select text to style it or turn on a style before typing. The browser handles
editing, conversion, writing stats, and hints.

Use **Boldemort** in the UI and docs and `Boldemort` in the repository and
GitHub Pages paths. The name plays on “bold” and “Voldemort.”

### What success looks like

1. Open [Boldemort](https://marcelpetrick.github.io/Boldemort/) without an
   account.
2. Enter or paste ordinary text into one familiar editor.
3. Use **Bold**, _Italic_, Underline, and Strikethrough either on a selection or
   on future typing.
4. Edit raw GitHub Flavored Markdown (GFM) in **Markdown mode**.
5. Switch to **Unicode mode** to work with actual stylized characters, not
   visual CSS tricks.
6. Switch back without silently losing content or structure; be warned where
   exact translation cannot be guaranteed.
7. Copy **Markdown** or **Unicode** output independently of the current editing
   mode.
8. See live word, character, paragraph, and sentence statistics, plus
   platform-length guidance.
9. Receive helpful nonintrusive line-based warnings for likely problems.
10. Export the document manually as a local text file and leave without any
    server-side storage.

### Product principles, in priority order

- **No silent data loss.** Preservation outranks automatic conversion, visual
  beauty, and feature breadth.
- **Plain text means plain text.** The editor is not WYSIWYG, does not silently
  produce HTML rich text, and does not merely apply CSS bold to letters.
- **One editor, two modes.** Switching modes transforms the same working
  document; the user does not manage two unrelated text boxes.
- **Fast, focused, and compact.** The central text area receives most available
  screen space.
- **Honest limitations.** Unicode is not a complete typography system and full
  GFM cannot always be converted into visually equivalent Unicode text.
- **Offline-capable runtime.** Once assets are loaded, all application
  functionality must work with no API calls and no outbound submission of user
  text.
- **Accessible and keyboard-friendly.** Unicode styling is an optional output
  convenience, not a replacement for semantic formatting in accessible
  documents.
- **Small, auditable implementation.** Prefer few dependencies, clear tests, and
  uncomplicated GitHub Pages deployment.

## 2. Scope, source of truth, and decision status

Use this file for product requirements and acceptance tests. The
[decisions](docs/DECISIONS.md) describe current defaults, and the
[implementation plan](docs/PLAN.md) tracks the work.

**Decision labels:**

- **DECIDED** — a requirement the owner approved.
- **TARGET** — a design or quality goal that leaves room for judgment.
- **OPEN** — a future decision. Use a conservative default where documented.

### Explicitly decided requirements

| ID   | Status  | Decision                                                                                                                                      |
| ---- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | DECIDED | Name the product and repository **Boldemort**.                                                                                                |
| D-02 | DECIDED | Use **one editing area** with **automatic conversion in both directions** when switching Markdown ↔ Unicode.                                  |
| D-03 | DECIDED | Clicking a formatting control **without selected text enables that style for subsequent typing**; clicking again turns it off.                |
| D-04 | DECIDED | “Cursive” means **Unicode mathematical italic**, not script/calligraphic fonts.                                                               |
| D-05 | DECIDED | Markdown underline syntax is **`<u>text</u>`**.                                                                                               |
| D-06 | DECIDED | Support **full GitHub Flavored Markdown** in Markdown mode.                                                                                   |
| D-07 | DECIDED | **Copy All** must let users choose **Markdown or Unicode**, not merely copy whichever mode is visible.                                        |
| D-08 | DECIDED | Save/export is **manual**, to a local text file. Browser autosave is **not** part of the specified workflow.                                  |
| D-09 | DECIDED | Support selected-text style toggling, including returning Unicode bold text to ordinary text.                                                 |
| D-10 | DECIDED | Include Bold, Italic, Underline, Strikethrough, and investigate/support bullet lists while retaining sensible layout.                         |
| D-11 | DECIDED | Show live **words**, **total characters**, **paragraphs**, **average words per sentence**, and **median words per sentence**.                 |
| D-12 | DECIDED | Provide discreet line-associated warnings and useful hints for problematic Markdown/layout where detectable.                                  |
| D-13 | DECIDED | Work comfortably at **800 × 600 CSS pixels**, use screen area efficiently, and reflow at browser zoom.                                        |
| D-14 | DECIDED | Include guidance about LinkedIn post, message, and article length and long text.                                                              |
| D-15 | DECIDED | Implement as static HTML/CSS/JavaScript or compiled TypeScript deployable through GitHub Pages.                                               |
| D-16 | DECIDED | Display a product version; enumerate dependencies and versions; use GPL v3 or later; credit **Marcel Petrick** and acknowledge AI assistance. |

### Out of scope / forbidden substitutions

- A `contenteditable` HTML rich-text document masquerading as the source of
  truth.
- Fake Unicode formatting achieved only by CSS or `font-weight`.
- Multiple unlinked source editors in place of the agreed one-editor mode
  switch.
- Account registration, login, hosted document storage, text analytics,
  tracking, remote conversion APIs, or subscription features.
- Automatic cloud saving or automatic browser `localStorage`/IndexedDB saving of
  drafts without a new owner decision.
- Silent truncation or deletion when LinkedIn limits are exceeded.
- Copying third-party application source code, text, or visual assets from the
  reference page.

## 3. Target users and primary workflow

The primary user writes social and professional content, particularly on
LinkedIn, and wants real bold and italic Unicode glyphs that can survive
plain-text pasting into platforms without formatting controls. A secondary user
edits Markdown documents and wants an easy way to export Unicode-styled prose.
The tool is standalone, privacy-preserving, and should not require knowing
Markdown to operate the toolbar.

### Primary user journey

1. Visit Boldemort; a readable blank editor is focused or ready to focus.
2. Start typing; line breaks and ordinary characters are never unexpectedly
   transformed.
3. Select `Hello world`, press **B**, and see `𝐇𝐞𝐥𝐥𝐨 𝐰𝐨𝐫𝐥𝐝` using
   mathematical bold serif letters.
4. Select the styled phrase and press **B** again to restore `Hello world`
   without changing punctuation or adjacent text.
5. Place the caret with no selection, press _I_, and type; the ensuing supported
   letters use the active style until _I_ is toggled off.
6. Switch into Markdown mode; the text uses visible Markdown syntax where a
   reversible equivalent exists.
7. Write GFM headings, lists, links, task lists, fenced code, and tables in
   Markdown mode, without losing their literal source.
8. Switch back to Unicode mode. Supported inline emphasis becomes actual Unicode
   styling; syntax and structural constructs without an exact Unicode
   counterpart are represented conservatively (see §5).
9. See words, characters, paragraphs, sentence averages/median, and a selected
   LinkedIn limit update as editing continues.
10. Pick **Markdown** or **Unicode** as the output, then use **Copy all**.
11. Use **Export** to download a local `.md` or `.txt` file.

### Important alternate journeys

- Paste a Unicode-styled fragment from elsewhere; supported letters should be
  recognized, while unfamiliar symbols must be preserved exactly.
- Paste or edit a long article; the editor scrolls and remains responsive, with
  analysis deferred when necessary.
- Write incomplete Markdown while drafting; no error pop-up should interrupt
  each keystroke.
- Navigate and format using only keyboard controls.
- Enlarge browser zoom to 200% or 400%; content, controls, copy, and export
  remain reachable.
- Export the draft if you want to keep it after leaving the page.

## 4. Interface and layout specification

### Page layout

1. Header with the name, language, and theme.
2. A short overview that readers can collapse.
3. The draft card with editing modes, formatting, copy and export, and Help
   and Clear draft. Leave most of the card for the editor. Put writing stats
   below the draft.
4. LinkedIn length guidance and a footer with version, author, and project
   links.

### Layout rules

- At 800 × 600 CSS pixels, the toolbar, mode switch, edit area, copy action, and
  key status information must be usable. Do not force a nominal minimum width of
  800px; smaller screens must still reflow.
- Prefer one centered writing column with a sensible maximum width (initial
  target roughly 720–1100 CSS pixels), responsive padding, and no unnecessary
  permanent sidebars.
- Make the editor the flexible vertical element, with internal scrolling for
  long drafts. Avoid a fixed editor height that crowds out writing at small
  viewports.
- Allow the toolbar to wrap into additional rows; group secondary actions in an
  overflow menu at very narrow widths if useful.
- At browser zoom 200% and 400%, the interface must not hide essential
  functionality behind overlays or produce avoidable page-wide horizontal
  scrolling.
- The diagnostic gutter must scroll in sync with the editor. Do not build a
  complex synchronized line overlay that breaks caret positions, IME editing, or
  selection just to satisfy a visual sketch; use a simpler indicator if needed.
- Keep labels/tooltips understandable; color alone is insufficient to
  communicate formatting state or severity.
- Use conventional keyboard focus outlines, semantic buttons, and adequate hit
  areas for pointer/touch interaction.
- Provide clear active/inactive styles for B/I/U/S and a visible current mode.
  Version and license/about details can sit discreetly in header/footer/dialog.
- Avoid ornamental UI, promotional content, heavy animations, and a bloated
  settings screen.
- An optional Markdown preview is **not approved**. Do not make preview central
  to the initial interface.

### Visual appearance

Use clear type, comfortable line spacing, and visible text selection. Offer
Light, Dark, Bavarian, and System. Start with System and keep toolbar controls
easy to see in each theme.

## 5. Document architecture and mode conversion

This section is the most important technical requirement. Automatic conversion
is explicitly decided; flawless conversion of every GFM feature into plain
Unicode is **not technically possible**. The design must handle that conflict
truthfully.

### 5.1 One logical document

- There is one user's document, displayed and directly editable in whichever
  mode is active.
- Changing the mode changes the editing representation, not which document is
  open.
- **Markdown mode:** literal Markdown text, including punctuation, Markdown
  delimiters, raw HTML underline tags, and all ordinary Unicode prose/emoji.
  “ASCII Markdown” refers to plain-text markup notation; **do not restrict prose
  to 7-bit ASCII**.
- **Unicode mode:** literal plain text with Unicode mathematical styled
  characters and supported combining marks for selected styling. These
  characters are actual copied characters, not rendered CSS emphasis.
- Switching modes must retain text, lines, and nonconvertible constructs;
  conversion must not silently strip content.

### 5.2 Safe representation strategy (TARGET)

A suitable approach is to keep an internal **loss-preserving document model**
that knows both editable views: an AST or tokenized Markdown source with stable
source spans, style annotations, and/or metadata for ambiguities. The agent may
choose a different mechanism if tests demonstrate the same guarantees. It must
**not** rely solely on naïve regex replacement of entire Markdown strings.

**Required safety guarantees:**

1. Switch Markdown → Unicode → Markdown **without intervening edits**: recover
   the original Markdown byte-for-byte where practical; otherwise preserve all
   literal content and explicitly document any normalization. For untranslatable
   GFM source, prioritize exact source preservation.
2. Switch Unicode → Markdown → Unicode without intervening edits: preserve
   original Unicode characters, including unknown code points and combining
   sequences, insofar as the editor can represent them.
3. With edits in the second mode, preserve unchanged portions and apply
   transformations to the changed spans. When the edit invalidates a stored
   source association, the system must either use a documented conservative
   fallback or warn before a destructive conversion.
4. Never drop an unsupported Unicode character, emoji, accent, separator, list
   item, link URL, code block, or Markdown raw HTML fragment simply to produce a
   visually pleasing Unicode view.
5. Avoid changing text outside the selected region; preserve exact
   leading/trailing spaces and line breaks when not structurally required by an
   explicit list operation.
6. Treat the encoding output as Unicode UTF-8 for export; avoid invalid
   surrogate sequences and accidental duplicate combining marks.
7. Unsupported/ambiguous conversion must be **nonblocking for ordinary editing**
   but conspicuous before a potential loss of information. If conversion cannot
   preserve meaning, keep the raw source literal and show a hint; do not invent
   a lossy equivalent silently.

**Practical boundary:** a Unicode-only plain-text representation cannot express
all GFM semantics (URLs with label targets, images, tables, fenced code, nested
lists, tasks, HTML, reference links). For these constructs, the first
implementation may preserve the **original Markdown syntax literally inside the
Unicode editor**, rather than pretending to render a faithful Unicode
equivalent. This is a **TARGET default, not an owner-approved visual output
policy**. The user-visible hint should explain that some markup remains literal
to avoid damage.

### 5.3 Formatting mappings

| Formatting intent                     | Markdown mode                                    | Unicode mode                                               | Considerations                                                                              |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Bold                                  | `**text**` (also recognize valid GFM `__text__`) | Unicode mathematical bold letters; digits when supported   | Preserve punctuation and unsupported scripts.                                               |
| Italic                                | `*text*` (also recognize GFM `_text_`)           | Unicode mathematical italic letters                        | No script/calligraphic style.                                                               |
| Bold + italic                         | `***text***` or equivalent valid nesting         | Unicode mathematical bold italic where available           | Not all digit/letter combinations exist.                                                    |
| Underline                             | `<u>text</u>`                                    | Selected underline mark from §5.3.1                        | Rendering/reversibility differ across apps. HTML tag literal is the agreed Markdown syntax. |
| Strikethrough                         | `~~text~~` (GFM)                                 | Selected strikethrough mark from §5.3.1                    | Do not add duplicate marks when toggling.                                                   |
| Unordered bullet                      | Valid GFM `- item`, `* item`, `+ item`           | `• item` as candidate                                      | Nested indentation/round-trip semantics need care.                                          |
| Ordered list                          | `1. item`, etc.                                  | Preserve numbered plain text when possible                 | Continue numbering only when semantics are clear.                                           |
| Task list                             | `- [ ] task`, `- [x] task`                       | Preserve literal GFM or document a safe glyph mapping      | Check status and nesting must not vanish.                                                   |
| Headings, tables, links, images, code | Full literal GFM                                 | Preserve source when no faithful Unicode equivalent exists | No destructive approximations.                                                              |

**Specific limitation:** not every Unicode script, diacritic, number, emoji, or
punctuation character has a mathematical bold/italic equivalent. Mathematical
italic has no universal digits. Some input is already stylized; normalization
may be many-to-one. Use explicit lookup tables and reverse mappings, not
arithmetic offsets that assume every glyph range is contiguous. Track Unicode
grapheme clusters and combining sequences so marks attach to whole characters.

### 5.3.1 Copyable line variants

- [YayText strikethrough](https://yaytext.com/strike/) defines short (U+0335),
  long (U+0336), and tilde (U+0334). Default to short.
- [YayText underline](https://yaytext.com/underline/) defines double macron
  below (U+035F), low line (U+0332), and double low line (U+0333). Default to
  double macron. Decorative under-shapes are outside the line controls.
- Offer independent choices in the editor. Applying them writes one selected
  combining mark per supported grapheme, including inter-word spaces. Tabs and
  line breaks retain their original bytes. Verify that the editor font renders
  strike marks over their base letters in Unicode mode.
- Recognize older and pasted line variants. Toggling off removes the selected
  style and preserves the other style, accents, and emoji. Existing styled text
  keeps its Unicode spelling when changing a choice. Convert supported runs into
  Markdown and restore the exact pasted spelling on an unchanged round-trip.
- The footer links to the source project, Marcel Petrick's email, and CI test
  results. A short overview describes LinkedIn and plain-text email use in one
  paragraph and at most five bullets, in both supported languages.

### 5.3.2 Random font and Bavarian theme

- Put the overview beneath the headline and before the draft, open on first
  load. Keep the introductory paragraph and three bullets in English and German.
- In Unicode mode, Random font remaps Latin letters and digits independently
  to copyable Unicode alphabets. Click again on randomized text to restore
  Latin letters and digits. Both actions are undoable. With an empty selection
  it toggles random styles for new typing.
- Preserve original character order, punctuation, accents, emoji, line marks,
  and code spans. Copy the produced code points, and preserve them literally
  when switching to Markdown. The control is unavailable in Markdown mode.
- Offer a Bavarian blue-and-white theme alongside System, Light, and Dark.
  Theme selection keeps the draft, and its colors must pass the browser
  accessibility checks.

### 5.4 Selection and toggle semantics

- On a nonempty selection, clicking **B** in Unicode mode converts the selected
  supported letters/digits to bold. Clicking it again on that bold selection
  removes bold and restores ordinary characters. The same conceptual toggle is
  needed for I/U/S, honoring available Unicode ranges and fallback rules.
- In Markdown mode, applying B to a selection surrounds or updates the selection
  according to valid GFM syntax. Toggling an already bold selection removes
  bold, rather than nesting extra asterisks. Underline uses literal `<u>…</u>`
  tags.
- No selection: clicking B/I/U/S **arms or disarms the corresponding style for
  subsequent typing**. It must be possible to type several words with that mode,
  toggle it off, and continue in ordinary text. Mode-switch behavior for an
  armed style should remain predictable.
- The caret, selection, scroll position, and editor focus should survive toolbar
  operations to the extent a plain-text editing model allows; clicking a toolbar
  button must not unexpectedly lose the selected range.
- Mixed selections (part plain, part already formatted) need deterministic
  behavior; recommended default: if **every eligible character** has the target
  style, remove it throughout; otherwise apply the style to all eligible
  characters. Leave unrelated styles untouched. Label this a provisional TARGET
  until accepted.
- Combining styles should not strip other active styles, e.g., applying italic
  to bold prose should produce bold italic where Unicode supports it.
- The active toolbar state should be visible; IME/composition events,
  right-to-left text, keyboard selection, clipboard paste, and undo must not be
  broken.
- Prefer intuitive shortcuts such as Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+Z/Shift+Z,
  without overriding native browser shortcuts unpredictably. Underline/strike
  shortcuts may be proposed/documented.
- Provide undo/redo for editing and toolbar transformations. Changes from a
  single formatting action should be one logical undo step.

### 5.5 Editing around markup and selections

- Markdown-mode toolbar operations should respect existing GFM delimiters and
  preserve syntactically valid nesting.
- Unclosed formatting markers during typing are not automatically errors; the
  user may be halfway through a construct.
- Format toggles must not alter content in fenced code blocks, inline code,
  URLs, or raw HTML attributes as though those regions were ordinary prose.
- Selecting the whole draft should format eligible text in one action.
  Preserve protected source and show a noticeable message when it is skipped.
- Keep Help and Clear draft next to the editor controls. Make warnings
  prominent and give readers a concrete action when one is available.
- If selecting across Markdown structural nodes cannot be transformed safely,
  issue a contextual hint rather than mangling the document.
- Handle newline insertion in lists conservatively; automatic continuation is a
  **TARGET**, not a guarantee. An empty list item should be easy to exit.
- Paste should default to plain text, with Unicode and line-ending handling
  documented.

## 6. Full GitHub Flavored Markdown support

**DECIDED:** full GFM is supported in **Markdown mode**. Interpret this as the
ability to **edit, parse/validate, preserve, and export** the full GFM grammar,
not as a promise that every construct becomes visual Unicode when copied to
LinkedIn.

The agent should treat the
[GitHub Flavored Markdown specification](https://github.github.com/gfm/) as the
dialect reference, including CommonMark core and GFM extensions. At a minimum,
Markdown-mode editing and copy/export must preserve:

- Paragraphs, hard/soft line breaks, thematic breaks, headings (ATX and setext).
- Emphasis, strong emphasis, strikethrough, nesting, escaping, entities.
- Unordered/ordered/nested lists, tight/loose lists, and task-list markers.
- Blockquotes, indented/fenced code blocks, inline code spans.
- Links, reference-style links, images, autolinks, URLs.
- Tables, alignment markers, backslash escapes, code-fence languages.
- HTML blocks/inline HTML permitted by GFM; particularly `<u>…</u>` as the
  chosen underline syntax.

**Rendering caveat:** GFM may permit raw HTML syntactically while GitHub
sanitizes it in rendered contexts, and LinkedIn may not interpret raw
Markdown/HTML at all. Boldemort must describe the difference between plain-text
output and downstream rendering, rather than promising that copied Markdown will
be interpreted as formatting.

**Technical guidance:** if robust full-GFM parsing requires a library, a small
locally bundled, version-pinned, license-compatible dependency is preferable to
an incorrect handmade parser. Avoid runtime CDNs. Markdown source preservation
matters even when no rendered preview is included.

## 7. Validation, diagnostics, and line hints

**DECIDED:** the editor should inspect writing and indicate where a line appears
problematic, with helpful context. **TARGET:** diagnostics are advisory, not a
compiler that blocks normal writing.

### Examples of useful diagnostics

- An obviously unclosed fenced code block at the end of a document.
- A suspicious delimiter that appears intended as emphasis but is not parsed as
  such.
- Unexpected or inconsistent list nesting or numbering that likely changes
  intended layout.
- A malformed table row or likely wrong number of table cells (when detectable
  reliably).
- A link/image construct with probable missing closing punctuation or a broken
  destination.
- Very long paragraphs or output above a selected platform limit (separate
  writing hints).
- Ambiguous/lossy Markdown ↔ Unicode conversions.

### Diagnostic behavior

- Associate a hint with line number and, where feasible, source range and
  severity (`info`, `warning`, `error`).
- Provide a small gutter marker beside the line; keyboard and screen-reader
  users must have a textual diagnostics list or accessible equivalent.
- Explain the likely problem and a suggested correction, without modifying
  content automatically.
- Do not repeatedly flag characters while the user is midway through typing;
  wait until reasonable completion or debounce.
- Use a proper parse tree rather than simplistic global regex matching that
  misdiagnoses valid code fences, escaped syntax, URLs, or HTML.
- Distinguish **valid but potentially surprising GFM** from **syntactically
  invalid** content; GFM intentionally treats many unmatched delimiters as
  ordinary text.
- Diagnostics must not take over the editor or block copying/exporting.
- An empty or valid document should not display fake warning markers.
- Keep gutter and diagnostics in sync as lines are inserted, removed, wrapped
  visually, and scrolled.

**OPEN:** final diagnostic rule list, visual icons, warning thresholds, and
whether hints can be temporarily disabled. The implementation agent may start
with a small high-precision rule set rather than issue misleading warnings.

## 8. Live writing statistics

Show words, characters, paragraphs, average words per sentence, and median
words per sentence. Update after typing, paste, formatting, undo, redo, and
mode switching. Keep the metrics below the draft with short explanations.
A separate sentence count is a future option.

### Counting defaults

1. **Human-readable writing statistics** (words, paragraphs, sentences, average
   and median) are computed on **content text**, not Markdown delimiters or
   hidden conversion bookkeeping. If accurate semantic extraction is unavailable
   for a construct, indicate the methodology rather than count misleading syntax
   fragments.
2. **Editor character count** uses user-perceived Unicode grapheme clusters
   where supported (`Intl.Segmenter`), including emoji sequences as one
   perceived symbol where appropriate. Also offer an exact raw code-point or
   UTF-16 count in detail if useful.
3. **Destination-limit count** is calculated from the actual **selected copy
   output** (Markdown or Unicode), not from the visible-editor representation
   alone. Show the metric assumption (e.g., UTF-16 code units) and note that
   LinkedIn's exact counting rules are not guaranteed.
4. **Paragraph:** count each top-level Markdown block with visible text once.
   For example, a list with visible text counts as one block.
5. **Words:** Unicode-aware word segmentation when supported; punctuation/emoji
   handling needs tests. Use `Intl.Segmenter` for word and sentence segmentation
   where practical, with graceful fallback.
6. **Sentence length:** count words in each detected sentence. **Average** = sum
   of sentence word counts ÷ number of detected sentences. **Median** = middle
   sorted count, or arithmetic mean of the two central counts if sentence count
   is even.
7. Empty input should show `0` counts, and `—` rather than NaN for undefined
   average/median.
8. Metrics should not jump solely because Markdown markers are converted to
   equivalent Unicode styling; any legitimate difference in raw output length
   belongs in the copy-specific count.

### Example checks

| Content                          | Words | Paragraphs | Sentence word lengths | Average | Median |
| -------------------------------- | ----: | ---------: | --------------------- | ------: | -----: |
| Empty                            |     0 |          0 | none                  |       — |      — |
| `One two three.`                 |     3 |          1 | `[3]`                 |       3 |      3 |
| `One. Two three four.`           |     4 |          1 | `[1,3]`               |       2 |      2 |
| `One. Two three. Four five six.` |     6 |          1 | `[1,2,3]`             |       2 |      2 |

**OPEN:** statistics for a selection and a separate raw Markdown counter.

## 9. LinkedIn destinations, text length, and long drafts

Show estimated limits for LinkedIn posts, messages, and articles. For each
preset, show how much is used and how much is left. Warn near the limit and
after it is exceeded. Keep typing, copying, and exporting available.

### Presets in Boldemort

The [preset configuration](src/analysis.ts) records the source and review
date for each estimate. Future changes should check those sources first.

| Destination | Estimated limit in UTF-16 units | Label shown |
| --- | ---: | --- |
| Feed post | 3,000 | LinkedIn guidance |
| Article | 125,000 | LinkedIn guidance |
| Direct message | 8,000 | Reported limit |
| InMail body | 1,900 | Conservative estimate |
| Connection note | 200 | LinkedIn guidance |

### Reference sources

- Posts and articles: <https://www.linkedin.com/help/linkedin/answer/a522483>
- Invitation notes: <https://www.linkedin.com/help/linkedin/answer/a563153>
- InMail (2,000 claim): <https://www.linkedin.com/help/linkedin/answer/a541779>
- InMail (1,900 claim): <https://www.linkedin.com/help/linkedin/answer/a411986>
- Sponsored Message Ads:
  <https://www.business.linkedin.com/advertise/ads/sponsored-messaging/message-ads/specs>
- Ordinary messages (third-party report):
  <https://www.linkedhelper.com/blog/linkedin-character-limit>
- Ordinary messages (third-party report):
  <https://support.reply.io/hc/reply-help-center/articles/linkedin-automation-limits-best-practices-and-recommendation>

### Behavior requirements

- Default to **No destination / General**, or let the user explicitly choose a
  platform preset.
- Clearly distinguish platform-supported vs third-party/reported values in the
  UI or accessible tooltip.
- Keep limits in a single configuration source with descriptive field name,
  units, source URL, and last-reviewed date.
- Warn at 90% of the estimate. Show how many units are over the limit when
  the output exceeds it.
- Never silently trim text, automatically split posts, or prevent copying
  without consent.
- Compute the displayed limit against the **chosen clipboard representation**.
  Unicode mathematical letters frequently occupy **two UTF-16 code units per
  visible glyph**; combining marks also increase length. Show why visible
  character count and estimated platform count may differ.
- If the post is over length, suggest editing it or changing to a suitable
  longer format. Do not imply all LinkedIn destinations render Markdown/Unicode
  formatting identically.
- Provide internal scrolling and adequate performance for article-length texts.
  The editor itself should not impose a small hard character cap.

**OPEN:** exact LinkedIn counting rules, additional presets, and whether
InMail needs more than one profile.

## 10. Copy, paste, file operations, and document lifecycle

### Clipboard

- Let the user pick **Markdown** or **Unicode** as output in either editing
  mode. **Copy all** copies the whole draft.
  Ordinary Ctrl/Cmd+C must still copy the current selection using normal browser
  behavior unless explicitly extended.
- Copy the **exact selected output representation** as `text/plain`. HTML-rich
  clipboard export is not required.
- Clipboard success/failure feedback should be brief, visible, and accessible;
  failed copy must not delete or mutate text.
- If modern clipboard access is unavailable, use a safe fallback or offer manual
  selection/copy instructions.
- Copy should not alter the editor mode or accidentally clear formatting state.
- If unrepresentable GFM features are preserved as literal source in Unicode
  output, the user should know this before copying.

### Manual save/export — DECIDED

- Provide **Export** with a `.md` download for Markdown and a `.txt` download
  for Unicode. A native save dialog is optional. The download must work in
  modern browsers without special permissions.
- Export is **manual only**. No automatic draft persistence or automatic saving
  to localStorage, IndexedDB, cloud, or server should be introduced.
- Filenames should be safe and predictable, e.g., `boldemort-draft.md` /
  `boldemort-draft.txt` (or an explicitly entered name).
- Use UTF-8 and preserve line breaks. Respect whether the user exports Markdown
  or Unicode rather than relying on the current display mode.
- Confirm before clearing the draft. The user can undo Clear draft in the same
  tab.
- **OPEN:** import/open existing `.txt`/`.md` files, multiple drafts/tabs, and
  precise unsaved-changes indicators. A minimal one-document implementation is
  acceptable initially.
- Export is how the user keeps a draft when leaving. Any future browser
  departure warning would be advisory because browser support varies.

### Paste and external compatibility

- Paste should not carry rich HTML styles into the editor; edit real text.
- Different applications may render mathematical letters, underline, and strike
  overlays inconsistently; document this instead of promising universal support.
- Keep combined marks attached to their grapheme and avoid duplicating marks
  after toggle cycles.

## 11. Accessibility, privacy, security, and reliability

### Accessibility

- All controls have accessible names; states and diagnostics are announced
  without excessive interruptions.
- Main editing remains keyboard-operable; menus and warnings are reachable by
  keyboard and screen readers.
- Respect system font scaling and browser zoom. Do not prevent text selection or
  context-menu use.
- Avoid a color-only warning language; include text/icon/severity.
- Provide screen-reader explanations that mathematical Unicode glyphs can be
  read inconsistently or as letter names; Markdown may be a more accessible
  export in some contexts.
- Support composed input (IME) and preserve writing in non-Latin scripts even
  where styled Unicode replacements are absent.

### Privacy and security

- Document contents stay in browser memory until explicitly exported/copied.
  **Do not transmit entered text** to remote services.
- No telemetry, cookies for tracking, accounts, or external text-conversion
  services.
- Work without network connectivity after initial static assets are available.
  Do not require web fonts, CDNs, or runtime API calls.
- If implementing an optional Markdown preview in a future version, untrusted
  HTML must be sanitized; do not render user-supplied HTML with an unchecked
  `innerHTML` path.
- Treat links and pasted HTML as untrusted input; avoid script execution or
  unsafe URL handling.
- Prefer a restrictive Content Security Policy compatible with local assets and
  GitHub Pages where practical.

### Stability/performance

- Do not drop or reorder characters during conversion or keyboard editing.
- Conversions should be deterministic and idempotent on repeated application of
  the same style.
- Batch edits logically for undo/redo and preserve caret behavior.
- Word stats and diagnostics should update without making keystrokes feel
  delayed; throttle expensive parsing on long files.
- Handle empty input, unusual Unicode, surrogate pairs, combining sequences,
  CRLF/LF, tabs, trailing newlines, and paste of large documents.
- Support current versions of Chrome/Edge, Firefox, and Safari on desktop, with
  sensible mobile behavior.
- Use feature detection for `Intl.Segmenter`, clipboard, and optional file APIs;
  provide fallbacks.

## 12. Technology and repository requirements

### Hard constraints

- **Repository:** `Boldemort`.
- **Hosting:** GitHub Pages, from a branch/root or a simple static build
  artifact.
- **Runtime:** entirely client-side HTML + CSS + browser JavaScript. TypeScript
  is permitted **only if compiled to JS** before deployment.
- **Backend:** none; no database, auth, hosted API, or SaaS dependency.
- **Asset paths:** use relative URLs or a correctly configured GitHub Pages base
  path; do not assume deployment at `/`.
- **Dependencies:** enumerate **every direct and bundled runtime/build
  dependency**, exact versions, licenses, and purpose. Prefer minimal
  dependencies and no runtime CDN.
- **Version:** use semantic versioning. Keep the version in sync across the
  package, editor, README, and changelog.
- **License:** provide the complete GNU GPLv3 license file and use the confirmed
  SPDX identifier `GPL-3.0-or-later`.
- **Attribution:** credit **Marcel Petrick** (<mail@marcelpetrick.it>) as author
  and disclose AI assistance.
- **Code ownership:** generate original code and assets. Inspiration from an
  external Unicode editor does not grant permission to copy it.

### Repository layout

- `index.html` and `src/` hold the editor.
- `tests/`, `config/`, and [localPipeline.sh](localPipeline.sh) hold the checks.
- `scripts/` holds build and maintenance tools.
- `docs/` holds the [architecture](docs/ARCHITECTURE.md),
  [changelog](docs/CHANGELOG.md), and [dependency inventory](docs/DEPENDENCIES.md).
- `.github/workflows/` holds CI, Pages deployment, and release workflows.

Commit the lockfile and keep builds reproducible.

### GitHub Pages deployment requirement

The application must work at the
[GitHub Pages address](https://marcelpetrick.github.io/Boldemort/) and serve
assets from the `/Boldemort/` subpath.

No page route, stylesheet, module import, Web Worker, or asset may silently fail
because of incorrect root-relative paths. README instructions must cover setup,
build (if any), local preview/test commands, GitHub Pages publishing, license,
and dependency disclosure.

## 13. Quality assurance and acceptance tests

Use these examples when testing a change. The checkboxes are a reusable
checklist for verification.

### A. Text editing and styling

- [ ] Plain typing, paste, cut, selected copy, delete, caret navigation, undo,
      and redo work without corruption.
- [ ] In Markdown mode, select `hello`, click B ⇒ `**hello**`; toggle the same
      region again ⇒ `hello`.
- [ ] In Unicode mode, select `Hello 123`, click B ⇒ genuine Unicode bold
      equivalents; toggle again ⇒ `Hello 123` exactly.
- [ ] Clicking B with an empty selection arms bold for subsequent typing;
      clicking B again disarms it.
- [ ] Italic produces **mathematical italic** where available, not
      calligraphic/script glyphs.
- [ ] Markdown underline inserts/removes `<u>…</u>` and does not pretend
      underline is standard Markdown.
- [ ] Unicode underline/strike toggles do not duplicate combining marks on
      repeated use.
- [ ] Applying italic to bold does not unexpectedly remove bold, where bold
      italic is supported.
- [ ] Styling one selection does not alter neighboring spaces, punctuation,
      emoji, or other scripts.
- [ ] Toolbar clicks preserve selection/focus and logically undo as a single
      operation.
- [ ] Formatting controls inside code blocks do not destructively rewrite
      literal code.

### B. Mode switching and full GFM

- [ ] There is exactly one directly editable working document, not two unrelated
      editors.
- [ ] Markdown → Unicode → Markdown without edits preserves ordinary content and
      all source GFM constructs, especially lists, links, code, tables, HTML
      underline, task boxes, and images.
- [ ] Unicode → Markdown → Unicode without edits preserves original Unicode
      content and unknown symbols.
- [ ] After editing in the alternate mode, unchanged source regions survive and
      ambiguous conversions never silently delete content.
- [ ] The editor can open/edit/export valid GFM source including tables, nested
      task lists, links, blockquotes, and fenced code.
- [ ] Where no valid Unicode structural equivalent exists, the content stays
      literal or a clear warning provides safe guidance.
- [ ] Bullet formatting maintains readable indentation and does not silently
      discard list structure.
- [ ] Incomplete Markdown while typing does not produce excessive or misleading
      errors.

### C. Clipboard, files, stats, and limits

- [ ] **Copy all** with Markdown selected outputs Markdown in either editor
      mode.
- [ ] **Copy all** with Unicode selected outputs supported Unicode styling in
      either editor mode.
- [ ] Copy is plain text, not CSS/HTML styling, and does not mutate the working
      document.
- [ ] Clipboard failure leaves the user's text intact and is explained
      accessibly.
- [ ] Save/export to `.md` and `.txt` works without a backend; no automatic
      saving occurs.
- [ ] All five required statistics update with each relevant edit or mode
      change.
- [ ] Mean/median match controlled sentence examples; empty input never produces
      NaN.
- [ ] Character counting distinguishes visible graphemes, copied output length,
      and estimated LinkedIn units where needed.
- [ ] Selecting a LinkedIn preset shows used/max/remaining and advisory
      over-limit warnings.
- [ ] Over-limit documents are neither truncated nor prevented from
      exporting/copying.

### D. Diagnostics, responsive design, and deployment

- [ ] High-confidence Markdown problems can show a line-associated marker and
      readable explanation.
- [ ] Escaped Markdown, code blocks, valid GFM, and still-in-progress typing do
      not trigger spurious warnings.
- [ ] 800 × 600 CSS viewport leaves editing and main toolbar accessible.
- [ ] At 200% and 400% browser zoom, controls reflow and no essential area
      becomes unreachable.
- [ ] Keyboard-only and screen-reader workflows allow editing, formatting,
      copying, exporting, and viewing diagnostics.
- [ ] A long (article-length) draft remains usable without an avoidable
      keystroke bottleneck.
- [ ] No runtime outgoing requests are needed for content processing.
- [ ] GitHub Pages loads every asset from the `/Boldemort/` subpath.
- [ ] UI version matches README/changelog; license, Marcel Petrick author
      credit, AI disclosure, and dependency inventory are present.

### Suggested automated test cases

Include conversion and round-trip fixtures covering ASCII A–Z/a–z, supported
digits, italic and bold italic, accents, non-Latin scripts, emoji with skin-tone
modifiers, ZWJ emoji, mixed normal/styled selections, multiple underline/strike
toggles, Markdown escapes, nested formatting, raw HTML underline, GFM tables,
nested lists, fenced code, CRLF, and strings with invalid or unusual
surrogate/combining sequences.

Use browser interaction tests for selection restoration, keyboard shortcuts,
clipboard behavior (mocked or permission-aware), zoom/reflow, focus, and file
export. A test suite passing on pure conversion logic alone does **not**
constitute a complete editor acceptance test.

## 14. Open product decisions

The [decisions](docs/DECISIONS.md) describe the defaults in use. Keep these
follow-up questions open until the owner chooses a different behavior.

| Area | Open question | Current or conservative behavior |
| --- | --- | --- |
| Conversion | How much original spelling can survive after editing the alternate view? | Preserve the source where the parser can still identify it. |
| Complex Markdown | Should more list types or other structures have a Unicode rendering? | Keep the original Markdown for unsupported structures. |
| Unicode emphasis | Should the editor offer other alphabets or rules for mixed selections? | Keep mathematical serif emphasis and the current selection toggle. |
| LinkedIn | Are more presets needed, and how does LinkedIn count characters? | Show an estimated count based on the selected output. |
| Diagnostics | Which additional hints are reliable and useful? | Keep warnings advisory and use high-confidence checks. |
| File workflow | Should the editor open files or manage more than one draft? | Keep one draft in the tab and offer manual export. |
| Extra controls | Should readers get a preview, selection metrics, or more shortcuts? | Keep the editor compact. |
| Draft lifecycle | Should the app warn before leaving the page? | Confirm Clear draft and rely on export for keeping drafts. |

## 15. Maintenance and release

Follow [AGENTS.md](AGENTS.md) and record work in the
[implementation plan](docs/PLAN.md). Start with the behavior in this brief
and keep new defaults easy to change. Build in small steps, then test the
normal editor workflows, unsupported conversion cases, and the Pages build.
Report the checks that ran, known limitations, and deployment status.

## 16. Definition of success

Boldemort should feel like opening a small, well-designed writing tool and
getting work done immediately: type, format, switch, inspect, copy, export. The
core promise is **real, reversible Unicode styling where possible; faithfully
preserved Markdown where not; no silent surprises**.

The entire product should remain small enough to self-host on GitHub Pages and
clear enough that an independent maintainer can understand the implementation,
dependency list, GPLv3 obligations, and limitations. The owner should not need a
server, subscription, login, cloud account, or rich-text editor to produce
useful formatted text.

---

### Document change history

- **2026-11-20:** updated the examples, navigation, presets, and maintenance
  guidance to match the running editor.
- **2026-11-19 — `vision.md` 1.0-draft:** consolidated the previous requirements
  drafts; incorporated all seven answered design decisions; fixed the canonical
  project and repository name to **Boldemort**; added agent implementation
  sequence, conversion safeguards, and acceptance tests. **No application
  implementation is included in this document.**
