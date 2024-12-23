import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  clean: true,
  dts: true,
  format: 'esm',
  outDir: 'lib',
  sourcemap: true,
})
