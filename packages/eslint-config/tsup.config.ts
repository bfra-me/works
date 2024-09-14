import {defineConfig} from 'tsup'

export default defineConfig({
  bundle: false,
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'lib',
})
