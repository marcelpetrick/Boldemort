import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { check: { type: 'boolean' } } });
const packageData = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const purpose = {
  'mdast-util-from-markdown':
    'Builds a source-positioned Markdown syntax tree.',
  'mdast-util-gfm': 'Adds GFM nodes to the syntax tree.',
  'micromark-extension-gfm': 'Tokenizes GFM syntax extensions.',
  '@axe-core/playwright': 'Browser accessibility assertions.',
  '@eslint/js': 'Recommended JavaScript lint rules.',
  '@playwright/test': 'Cross-engine browser test runner.',
  '@stryker-mutator/core': 'Isolated mutation analysis.',
  '@stryker-mutator/vitest-runner':
    'Runs unit tests against isolated mutations.',
  '@types/node': 'Node type definitions for tooling.',
  '@vitest/coverage-v8': 'Unit test coverage.',
  eslint: 'JavaScript and TypeScript static linting.',
  globals: 'Browser and Node global names for linting.',
  'html-validate': 'Static HTML and accessibility-markup validation.',
  'istanbul-lib-coverage': 'Browser coverage aggregation.',
  'istanbul-lib-source-maps':
    'Maps browser coverage back to TypeScript source.',
  'markdownlint-cli2': 'Markdown style and structure lint.',
  prettier: 'Source formatting.',
  stylelint: 'CSS static linting.',
  'stylelint-config-standard': 'Standard CSS lint rules.',
  typescript: 'TypeScript static type checking.',
  'typescript-eslint': 'TypeScript rules and parser for ESLint.',
  vite: 'Bundles local static assets and runs the dev server.',
  'vite-plugin-istanbul': 'Instruments browser code in test builds.',
  vitest: 'Unit test runner.',
};

const entries = new Map();
for (const [path, item] of Object.entries(lock.packages)) {
  if (!path) continue;
  const name = path.split('node_modules/').at(-1);
  const kind =
    Object.hasOwn(packageData.dependencies ?? {}, name) &&
    path === 'node_modules/' + name
      ? 'Direct runtime'
      : Object.hasOwn(packageData.devDependencies ?? {}, name) &&
          path === 'node_modules/' + name
        ? 'Direct development'
        : item.dev
          ? 'Transitive development'
          : 'Transitive runtime';
  const key = [name, item.version, kind].join('@');
  entries.set(key, [
    name,
    item.version,
    item.license ?? 'See upstream package',
    kind,
    kind.startsWith('Direct')
      ? purpose[name]
      : 'Dependency of a package listed here.',
  ]);
}

const table = [...entries.values()]
  .sort(
    ([a, av], [b, bv]) =>
      a.localeCompare(b, 'en') || av.localeCompare(bv, 'en'),
  )
  .map((fields) => '| ' + fields.join(' | ') + ' |')
  .join('\n');
const contents = `# Dependencies

Generated from the npm lockfile by \`node scripts/dependencies.mjs\`.
Runtime dependencies are bundled locally. The full lockfile also lists tools and
optional packages for other platforms.
<!-- markdownlint-disable MD013 -->

| Package | Version | License | Use | Purpose |
| --- | --- | --- | --- | --- |
${table}
`;

if (values.check) {
  if (readFileSync('docs/DEPENDENCIES.md', 'utf8') !== contents) {
    throw new Error(
      'Regenerate docs/DEPENDENCIES.md with node scripts/dependencies.mjs',
    );
  }
} else writeFileSync('docs/DEPENDENCIES.md', contents);
