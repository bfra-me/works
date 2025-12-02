import {defineConfig} from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index.ts',
    'src/result/index.ts',
    'src/functional/index.ts',
    'src/module/index.ts',
    'src/types/index.ts',
    'src/watcher/index.ts',
    'src/async/index.ts',
    'src/validation/index.ts',
    'src/error/index.ts',
    'src/env/index.ts',
  ],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  target: 'esnext',
})
