# Boldemort architecture

<!-- markdownlint-configure-file { "MD013": { "code_blocks": false } } -->

Boldemort saves one draft in the browser by default. The writer can edit it as
Markdown or Unicode, then copy or download either form. GitHub Pages serves
the app files. The browser handles the draft, undo history, and writing
checks locally.

The diagrams follow the [C4 model](https://c4model.com/diagrams).

## 1. System context

The writer brings text into Boldemort and moves the result to the next app.
LinkedIn, email, and other destinations receive text when the writer pastes or
opens an exported file.

```mermaid
C4Context
    System(boldemort, "Boldemort", "Edits and converts drafts in the browser")
    Person(writer, "Writer", "Edits a draft and chooses its output format")
    System_Ext(destination, "Publishing or writing app", "LinkedIn, email, or a text editor")

    Rel(writer, boldemort, "Prepares a draft")
    Rel(writer, destination, "Shares the result")
    UpdateRelStyle(writer, boldemort, $offsetX="-38", $offsetY="-17")
    UpdateRelStyle(writer, destination, $offsetX="-38", $offsetY="-14")
```

## 2. Containers

The editor is the single application container. GitHub Actions builds its
static files and GitHub Pages serves them. The editor uses browser APIs for
clipboard access, downloads, and local storage. On startup the editor reads
the saved draft from the same browser profile.

```mermaid
flowchart TB
    writer(["Writer"])
    pages["GitHub Pages · external host"]
    browser["Browser APIs · clipboard, downloads, local storage"]

    subgraph boldemort["Boldemort"]
        editor["Editor in the browser<br/>HTML, CSS, and TypeScript<br/>Draft and history in tab memory"]
    end

    writer -->|Edits the draft| editor
    pages -->|Serves static files over HTTPS| editor
    editor -->|Copies, exports, or saves the draft| browser
```

## 3. Components

The UI sends edits and selection changes to the document model. The model
owns the draft and its history. Markdown conversion and Unicode styling
operate on text, so they can be tested without a browser. The writing checks
and UI also use the Markdown parser and Unicode helpers for notices, writing
statistics, and the visible character count.

The draft reader validates the stored mode, line styles, and ordered pieces.
Restoring these pieces preserves both exact spellings and pending edits
without restoring the undo stack. A versioned storage key holds either one
snapshot or the off preference. Open tabs read the preference when storage
changes and check it before saving.

```mermaid
flowchart TB
    subgraph editor["Boldemort editor"]
        direction TB
        ui["Editor UI<br/>main.ts, index.html, style.css"]
        doc["Document model<br/>document.ts"]
        selection["Selection mapping<br/>selection.ts"]
        analysis["Writing checks<br/>analysis.ts"]
        help["Language and help<br/>i18n.ts, tooltip.ts"]
        draft["Saved draft validation<br/>draft.ts"]
        markdown["Markdown conversion<br/>markdown.ts"]
        unicode["Unicode styling<br/>unicode.ts"]

        ui -->|Applies edits| doc
        ui -->|Requests statistics and warnings| analysis
        ui -->|Shows labels and help| help
        ui -->|Validates the stored draft| draft
        doc -->|Projects the draft| markdown
        doc -->|Formats text| unicode
        doc -->|Maps the selection| selection
        selection -->|Reads Markdown source positions| markdown
        selection -->|Finds grapheme boundaries| unicode
        analysis -->|Parses the draft| markdown
        analysis -->|Reads styled text| unicode
        markdown -->|Translates styles| unicode
    end
```

## 4. Code view of the document model

Each history entry captures the mode, text, selection, and pieces of the draft.
A piece holds either both forms of a source span or an edit recorded in the
current mode. During conversion the model can reuse the exact earlier
spelling when the parser still recognizes that span. Complex Markdown such as
links and fenced code stays literal.

```mermaid
flowchart TB
    Document["Document"] --> Current["Current state"]
    Document --> History["Undo and redo stacks"]
    History --> State["Saved states"]
    Current --> Frame["Mode, text, and selection"]
    Current --> Pieces["Ordered pieces"]
    State --> Frame
    State --> Pieces
    Pieces --> Projection["Projection — Markdown and Unicode text"]
    Pieces --> Pending["Pending edit — mode and text"]
```

## Switching from Markdown to Unicode

The editor matches visible characters across the two views. It uses Markdown
source positions to skip formatting delimiters. If the two forms cannot be
matched character by character, the caret snaps to the nearest estimated
grapheme boundary.

```mermaid
sequenceDiagram
    actor Writer
    participant UI as Editor UI
    participant Doc as Document model
    participant Convert as Markdown conversion

    Writer->>UI: Choose Unicode
    UI->>Doc: Save selection and switch mode
    opt The draft has edits awaiting conversion
        Doc->>Convert: Project the current Markdown
        Convert-->>Doc: Return both forms of each span
    end
    Doc->>Doc: Save undo state and map the selection
    Doc-->>UI: Return the Unicode draft and selection
    UI-->>Writer: Show the converted draft
```

See the [product vision](../vision.md) for the conversion guarantees and
the [README](../README.md#local-development) for build and test commands.
