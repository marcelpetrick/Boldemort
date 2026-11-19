import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/{unicode,markdown,document,analysis,i18n}.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 95 },
    },
  },
});
