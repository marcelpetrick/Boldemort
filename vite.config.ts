import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(({ mode }) => {
  const instrumented = mode === 'coverage';
  return {
    base: './',
    build: {
      outDir: instrumented ? 'dist-coverage' : 'dist',
      sourcemap: instrumented,
      minify: !instrumented,
    },
    plugins: instrumented
      ? [
          istanbul({
            include: ['src/main.ts', 'src/tooltip.ts'],
            extension: ['.ts'],
            requireEnv: false,
            forceBuildInstrument: true,
          }),
        ]
      : [],
  };
});
