import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  clean: true,
  experimentalDts: true,
  format: 'esm',
  outDir: 'lib',
  sourcemap: true,
})
