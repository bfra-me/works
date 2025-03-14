import {defineConfig} from 'tsup'

// @keep-sorted
export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
})
