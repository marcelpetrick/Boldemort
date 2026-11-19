import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import lock from './package-lock.json' with { type: 'json' };
import istanbul from 'vite-plugin-istanbul';

function licenseAssets(): Plugin {
  return {
    name: 'boldemort-license-assets',
    generateBundle() {
      const notices = [];
      for (const [path, entry] of Object.entries(lock.packages)) {
        if (!path || ('dev' in entry && entry.dev)) continue;
        const filename = readdirSync(path).find((name) =>
          /^licen[cs]e(?:\.|$)/iu.test(name),
        );
        if (!filename)
          throw new Error('Missing third-party license file for ' + path);
        notices.push(
          path.split('node_modules/').at(-1) +
            ' ' +
            entry.version +
            '\n\n' +
            readFileSync(path + '/' + filename, 'utf8').trim(),
        );
      }
      this.emitFile({
        type: 'asset',
        fileName: 'LICENSE',
        source: readFileSync('LICENSE'),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'third-party-licenses.txt',
        source: notices.join('\n\n---\n\n') + '\n',
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const instrumented = mode === 'coverage';
  return {
    base: './',
    build: {
      outDir: instrumented ? 'dist-coverage' : 'dist',
      sourcemap: instrumented,
      minify: !instrumented,
    },
    plugins: [
      licenseAssets(),
      ...(instrumented
        ? [
            istanbul({
              include: ['src/main.ts', 'src/tooltip.ts'],
              extension: ['.ts'],
              requireEnv: false,
              forceBuildInstrument: true,
            }),
          ]
        : []),
    ],
  };
});
