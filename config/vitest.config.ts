import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/{unicode,markdown,document,selection,analysis,i18n}.ts'],
      reporter: ['text', 'html', 'json-summary'],
    },
  },
});
