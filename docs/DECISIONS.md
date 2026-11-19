# Project decisions

## Repository preparation

- Use the product vision as the source for acceptance scenarios and scope. Keep
  the work sequence in [PLAN.md](PLAN.md).
- Use the [DarkFactory workflow](https://github.com/marcelpetrick/DarkFactory)
  for implementation and delivery. Adopt its GPLv3 and verification defaults.
- Choose the runtime, dependencies, test tools, and packaging after reading
  the vision. Record consequential choices here with their rationale and
  tradeoffs when they are made.

## Implementation

- Use a static TypeScript application with Vite and a source-positioned GFM
  parser. A single textarea displays one logical draft. The draft is in memory.
- Use mathematical serif letters, with a lookup for italic h. Map simple
  unordered bullets and keep nested lists, tasks, and other complex GFM
  literal. Reuse original spellings for intact conversion spans. Reparse
  edited content as a whole to respect new Markdown syntax.
- Use English and German and system, light, and dark themes. All choices last
  for the current tab. The Help dialog makes long contextual help available
  on touch devices.
- Use UTF-16 units for LinkedIn estimates, warn at 90%, and label reported or
  conservative limits. Main writing statistics use parsed text and visible
  grapheme clusters.
- Build a static artifact for GitHub Pages. Use separate test instrumentation
  and a copy of the source for mutation testing.
- The owner selected GPL-3.0-or-later. Credit Marcel Petrick
  (<mail@marcelpetrick.it>) as the author in the app and README and acknowledge
  AI assistance.
