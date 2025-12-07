import {defineConfig} from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index.ts',
    'src/types.ts',
    'src/parsers/index.ts',
    'src/generators/index.ts',
    'src/orchestrator/index.ts',
    'src/utils/index.ts',
    'src/watcher/index.ts',
    'src/cli/index.ts',
  ],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  target: 'esnext',
})
