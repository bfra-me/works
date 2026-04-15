import {dts} from '@bfra.me/works/tsup.dts'
import {defineConfig} from 'tsup'

export default defineConfig({
  clean: true,
  dts,
  entry: ['src/index.ts', 'src/cli.ts', 'src/types/index.ts'],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  target: 'esnext',
})
