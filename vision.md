# Boldemort — Product Vision and Implementation Brief

<!-- markdownlint-configure-file { "MD013": { "tables": false } } -->

> **Project:** Boldemort\
> **GitHub repository name:** `Boldemort` (exact capitalization)\
> **Canonical document:** `vision.md` at the repository root\
> **Document version:** 1.0-draft\
> **Last updated:** 2026-11-19\
> **Status:** Ready to guide an implementation agent; unresolved product
> decisions remain explicitly identified.\
> **Target:** Static GitHub Pages website\
> **Requested license:** GNU General Public License v3 or later\
> **Requested credit:** Marcel Petrick <mail@marcelpetrick.it>. Acknowledge AI
> assistance.

---

## 1. Vision

**Boldemort is a compact, dependable plain-text writing tool that lets people
compose once, switch between Markdown notation and copyable Unicode styling, and
publish attractive text in applications such as LinkedIn.** It should feel as
straightforward as a small word processor without becoming one. The user writes
into a single, real text-editing area, selects text or activates a style for
subsequent typing, and copies the desired output. All editing, conversion,
diagnostics, and statistics run locally in the browser.

The name is **Boldemort**, a play on “bold” and “Voldemort.” The repository is
also **`Boldemort`**, not `Boldemot`, `Boldemort-editor`, or any other
variation. Use **Boldemort** consistently in the page title, branding,
repository URL, docs, package metadata, file references, and GitHub Pages
instructions. This is an independent original tool, not a copied implementation
or branding of the website that inspired the idea.

### What success looks like

1. Open `https://<username>.github.io/Boldemort/` without an account or backend.
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

This file consolidates the prior requirements notes, proposed acceptance tests,
platform-limit research, and the owner's latest answers. It is intended to be
the **single product brief** used by a coding agent. The older requirements
files are historical working notes; where they conflict with this document,
**this document wins**.

**Decision labels:**

- **DECIDED** — explicitly requested or answered by the project owner; implement
  as stated.
- **TARGET** — derived quality or architecture criterion needed to deliver the
  stated vision; the agent may implement with reasonable judgment.
- **OPEN** — not yet decided; use a conservative default only where instructed,
  document the assumption, and do not misrepresent it as an owner decision.

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
3. Select `Hello world`, press **B**, and see `𝗛𝗲𝗹𝗹𝗼 𝘄𝗼𝗿𝗹𝗱` (illustrative
   Unicode sans-serif bold glyphs) **or the selected, documented mathematical
   bold alphabet**. Actual alphabet choice is a small open implementation
   detail; both are real Unicode characters.
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
10. Choose **Copy Markdown** or **Copy Unicode** and paste the result into
    another application.
11. Choose **Save/Export** to write a local `.md` or `.txt` file explicitly.

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
- Attempt to navigate away with unsaved changes; at most provide an honest,
  browser-supported unsaved-work warning, not fictional autosave or guaranteed
  recovery.

## 4. Interface and layout specification

### Baseline visual arrangement

```text
┌─────────────────────────────────────────────────────────────────┐
│ Boldemort                              [Markdown | Unicode] v0.x │
├─────────────────────────────────────────────────────────────────┤
│ [B] [I] [U] [S] [•] [↶] [↷]    [Destination ▾] [Copy ▾] [Save] │
├─────────────────────────────────────────────────────────────────┤
│  ! │ This is one editable, scrolling plain-text document.      │
│    │                                                            │
│    │ A gutter marker can identify a likely issue on this line.  │
│    │                                                            │
│    │ The writing surface gets most of the available height.     │
│    │                                                            │
├─────────────────────────────────────────────────────────────────┤
│ Words 123 · Chars 650 · ¶ 3 · Avg 12.3 · Median 11 · 650/3000  │
└─────────────────────────────────────────────────────────────────┘
```

This is a **wireframe, not a pixel-perfect design order**. The user wants a
familiar text processor arrangement: controls above, writing beneath, important
metrics available without stealing the viewport.

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

**TARGET:** clean typography, comfortable line height, visible text selection,
subtle separations between header/toolbar/editor/status, and light visual
density. The editor offers light, dark, Bavarian, and system themes; let the
implementation agent choose an accessible neutral default and document the
choice.

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

**DECIDED visible metrics:** word count; total character count; paragraph count;
average words per sentence; median words per sentence. Update on typing, paste,
format toggles, undo/redo, and mode switching. Present the main numbers in a
compact footer/status bar with helpful tooltips for definitions. Sentence count
is a useful supporting metric in a details popover (**TARGET**).

### Counting model (proposed default; not yet owner-approved)

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
4. **Paragraph:** a contiguous block of text separated by one or more blank
   lines; headings/list items may need a documented policy when in GFM mode.
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

**OPEN:** whether selections show their own statistics, whether Markdown raw
markup counts in a secondary raw counter, and the exact paragraph/list-item
conventions. Keep the initial main figures consistent and documented.

## 9. LinkedIn destinations, text length, and long drafts

**DECIDED:** help users understand applicable maximum lengths for posts,
messages, and articles. The tool should optionally expose a small **destination
preset** selector, give `used / maximum` and `remaining`, and warn when
approaching/exceeding a limit. **TARGET default:** warnings do not block typing
or truncate the draft.

### Research baseline (researched 2026-11-18; reverify when implementing)

| Destination                          |          Provisional limit | Reliability / note                                                                                  |
| ------------------------------------ | -------------------------: | --------------------------------------------------------------------------------------------------- |
| LinkedIn feed post                   |       **3,000** characters | LinkedIn Help, official.                                                                            |
| LinkedIn article body                |     **125,000** characters | LinkedIn Help, official; older guides may differ.                                                   |
| Ordinary direct message              |       **8,000** characters | Reported by third parties, not confirmed in official Help used for this draft.                      |
| LinkedIn InMail message body         | **1,900–2,000** characters | Official Help sources conflict; show a caveat and use a conservative warning threshold if included. |
| InMail subject                       |         **200** characters | LinkedIn Help.                                                                                      |
| Personalized connection-request note |         **200** characters | LinkedIn Help; limits can vary by account/context.                                                  |
| Sponsored Message Ad                 |       **8,000** characters | Official marketing-ad context only; do not confuse with regular messages.                           |

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
- Use an advisory approach: an early warning near the limit and an explicit
  `over by N` warning after crossing it. Thresholds are **OPEN**; a first
  implementation can choose 90% warning and document it.
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

**OPEN:** final preset list, precise target counting algorithm (LinkedIn Help
does not fully specify it), warning threshold, and whether InMail variants need
multiple profiles. The agent can implement a configurable conservative baseline
and label it guidance.

## 10. Copy, paste, file operations, and document lifecycle

### Clipboard

- Provide explicit **Copy Markdown** and **Copy Unicode** options, perhaps under
  one small Copy menu. The user must be able to choose either regardless of the
  active editor mode.
- **Copy All** refers to the entire document, not only the selected text.
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

- Provide **Save/Export**, with `.md` for Markdown output and `.txt` for Unicode
  or plain-text output. If a browser supports the File System Access API, it can
  optionally offer a native save dialog, but ordinary downloadable Blob files
  must work in modern browsers without special permissions.
- Export is **manual only**. No automatic draft persistence or automatic saving
  to localStorage, IndexedDB, cloud, or server should be introduced.
- Filenames should be safe and predictable, e.g., `boldemort-draft.md` /
  `boldemort-draft.txt` (or an explicitly entered name).
- Use UTF-8 and preserve line breaks. Respect whether the user exports Markdown
  or Unicode rather than relying on the current display mode.
- Provide a deliberate New/Clear action with confirmation when content might be
  lost (**TARGET**).
- **OPEN:** import/open existing `.txt`/`.md` files, multiple drafts/tabs, and
  precise unsaved-changes indicators. A minimal one-document implementation is
  acceptable initially.
- **Unsaved work warning:** `beforeunload` is browser-dependent and not
  guaranteed (especially on mobile). Do not claim drafts are recoverable after
  closing without a save.

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
- **Version:** display SemVer-like version (`0.1.0` initially is reasonable;
  exact release numbering TBD) and keep it synchronized in metadata/docs/UI.
- **License:** provide the complete GNU GPLv3 license file and use the confirmed
  SPDX identifier `GPL-3.0-or-later`.
- **Attribution:** credit **Marcel Petrick** (<mail@marcelpetrick.it>) as author
  and disclose AI assistance.
- **Code ownership:** generate original code and assets. Inspiration from an
  external Unicode editor does not grant permission to copy it.

### Suggested layout for the GitHub repository

```text
Boldemort/
├── vision.md                     # this document: product source of truth
├── README.md                     # what it does, how to run/deploy
├── LICENSE                       # complete GNU GPLv3 text
├── CHANGELOG.md                  # user-visible release changes
├── DEPENDENCIES.md               # versions, licenses, and usage
├── index.html                    # app entry point (or build output)
├── src/                          # only if using a build tool
│   ├── editor.*
│   ├── conversion.*
│   ├── markdown.*
│   ├── statistics.*
│   ├── diagnostics.*
│   └── limits.*
├── styles/ or style.css
├── tests/                        # unit, integration, browser tests
├── .nojekyll                      # if required by chosen Pages layout
└── .github/workflows/            # optional Pages build/test deployment
```

This is a **suggestion**; a small no-build project can instead use a handful of
root-level files. Avoid needless infrastructure. If compiling TypeScript or
bundling a GFM parser, commit the lockfile and use reproducible builds.

### GitHub Pages deployment requirement

The deployed application must work from:

`https://<github-user-or-org>.github.io/Boldemort/`

No page route, stylesheet, module import, Web Worker, or asset may silently fail
because of incorrect root-relative paths. README instructions must cover setup,
build (if any), local preview/test commands, GitHub Pages publishing, license,
and dependency disclosure.

### Earlier prototype status

There is an older prototype generated under the misspelled project name
**Boldemot**. It is **reference material only**. It may be inspected for
reusable ideas and original code, but it is **not** accepted as the Boldemort
implementation: its editing modes, auto-saving behavior, formatting model, and
branding do not reflect the latest decisions. Never silently replace the
approved decisions with its behavior.

## 13. Quality assurance and acceptance tests

The implementation agent should create automated tests wherever practical and
then perform manual browser checks. Important examples follow.

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

- [ ] **Copy Markdown** produces Markdown no matter which mode is currently
      being edited.
- [ ] **Copy Unicode** produces supported Unicode styling no matter which mode
      is currently being edited.
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

## 14. Open product decisions and provisional implementation policy

These items have **not** been decided by the owner. The agent may start with the
foundation now, but should not represent these provisional answers as approved
or silently create irreversible behavior.

| Priority | Open question                                                                     | Conservative default for development                                                                         |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| P0       | What to do when converting complex GFM constructs to Unicode?                     | Keep unsupported source Markdown literal, preserve metadata/source, show nonblocking explanation.            |
| P0       | How strict should byte-exact round-tripping be after edits in the alternate mode? | Guarantee no content loss; preserve original source when possible; test and document normalization/fallback. |
| P0       | Which mathematical bold variant (serif vs sans-serif)?                            | Pick one consistent reversible mapping; make choice easy to change after review.                             |
| P0       | Precise behavior for partially mixed selections and format combinations?          | All-target → remove; mixed/partially styled → apply; preserve other styles.                                  |
| P1       | Unicode representation of nested bullets, numbered lists, task lists?             | Preserve structure/literal syntax rather than flattening ambiguously.                                        |
| P1       | Which LinkedIn presets in initial visible menu?                                   | General, Post, Direct Message, Article, InMail, Connection Note; label uncertain values.                     |
| P1       | What is the definitive limit counter convention?                                  | Display graphemes and estimated UTF-16 units; use the actual selected copied output for warnings.            |
| P1       | Which GFM diagnostics are reliable enough?                                        | High-confidence warnings only; avoid generic “invalid Markdown” claims.                                      |
| P1       | Export filename options and import/open existing files?                           | Manual export in Markdown/Unicode with simple filenames; import may be later.                                |
| P2       | Optional preview, detailed metrics, selected-text counts?                         | Keep release 1 compact; consider after core editing is robust.                                               |
| P2       | Save/clear confirmations and page-leave warning?                                  | Provide explicit confirmation for destructive clear; no autosave or false recoverability.                    |
| P2       | Keyboard shortcut scheme and diagnostics thresholds?                              | Use familiar nonconflicting shortcuts and conservative configurable warning levels.                          |

**Do not resurrect settled questions.** The seven answered decisions in §2 (one
editor, future typing, mathematical italic, `<u>` underline, full GFM,
selectable copy representation, manual export) are closed unless the owner
explicitly changes them.

## 15. Implementation execution plan for the coding agent

The next agent should begin **only after reading this complete `vision.md`**.
The task is to implement Boldemort, not to produce another set of generic
requirements or switch the concept to rich text. Work in small, verifiable
increments; report choices that are provisional.

### Phase 0 — Establish the project

- Create/initialize repository **`Boldemort`** and place this file at
  `vision.md` in its root.
- Choose a minimal static application structure and local build strategy (if
  needed).
- Add licensing, version metadata, README, dependency inventory, and tests
  scaffold.
- Document open assumptions in README or an explicit decisions section without
  blocking implementation of settled features.
- Do not migrate the old Boldemot prototype blindly; inspect it only as a
  reference.

### Phase 1 — Implement the editing foundation

- Build the single plain-text editor, mode switch, toolbar, selections, focus,
  keyboard shortcuts, and undo/redo.
- Implement tested Unicode maps and reverse maps with exact supported-character
  definitions.
- Support the agreed no-selection future-typing behavior; cover both modes.
- Write automated selection/toggle/round-trip tests before adding elaborate
  visuals.

### Phase 2 — Full Markdown and safe conversion

- Integrate a pinned, compatible GFM parser where necessary; keep all assets
  local.
- Preserve source structure and metadata; ensure GFM constructs not
  representable as Unicode are safe.
- Build automatic Markdown ↔ Unicode switching with well-defined
  lossy/unsupported cases.
- Add list helpers while preserving valid Markdown indentation/structure.
- Make Copy Markdown and Copy Unicode work independently of the active mode.

### Phase 3 — Writing assistance

- Implement five statistics plus tested sentence mean/median.
- Add LinkedIn destinations, documented count assumptions, and nonblocking limit
  warnings.
- Add high-confidence parsing diagnostics with line markers and a useful
  accessible explanation.
- Implement manual `.md`/`.txt` export, clear confirmation, and clipboard
  failure feedback.

### Phase 4 — Quality, packaging, and publishing

- Tune layout at 800 × 600 and browser zoom 200%/400%; prioritize the editor
  area.
- Check keyboard access, screen-reader labels, IME, mobile, undo/redo,
  clipboard, and long-text performance.
- Run unit and browser interaction tests; fix regressions rather than merely
  documenting them.
- Verify the GitHub Pages subpath `/<repo>/` and deployable static assets.
- Confirm credits, version, dependencies, and GPLv3 inclusion before publishing.
- Record unavoidable limitations and unresolved owner choices transparently.

### Definition of done for initial release

A first release is ready when the core workflows in §3 are implemented, critical
conversion/selection tests pass, no known silent-loss cases remain, the app
works at 800 × 600 and zoomed layouts, both copy formats and manual export work,
the requested metrics and reliable warnings are visible, and the repository can
be published to GitHub Pages without a backend. Open P0 conversion questions
must be resolved in code with conservative behavior **and clearly disclosed**,
not ignored.

### Agent behavioral instructions

1. **Use this document as the source of truth.** Do not overwrite it with a
   shorter generic PRD.
2. **Implement; do not re-collect settled requirements.** Ask for a decision
   only if a genuine blocker makes data preservation or other non-negotiable
   behavior impossible.
3. **Do not substitute rich text, WYSIWYG, CSS font styling, or a pair of
   independent editors.**
4. **Never trade away user text for a prettier conversion.** Warn, preserve, and
   test.
5. **Keep code readable and dependencies transparent.** Prefer tested primitives
   and documented limitations to overengineering.
6. **Preserve the exact Boldemort branding and repository name.**
7. **Treat unapproved defaults as provisional.** Do not hard-code them so deeply
   that later decisions require rewriting the product.
8. **Report progress with working code, tests, and specific unresolved
   choices**, not generic assertions of completion.
9. **Do not claim the website has been deployed unless deployment has actually
   succeeded.**
10. **Do not copy third-party source code from the inspiration site.**

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

- **2026-11-19 — `vision.md` 1.0-draft:** consolidated the previous requirements
  drafts; incorporated all seven answered design decisions; fixed the canonical
  project and repository name to **Boldemort**; added agent implementation
  sequence, conversion safeguards, and acceptance tests. **No application
  implementation is included in this document.**
