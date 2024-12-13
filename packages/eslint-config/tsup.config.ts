import {defineConfig} from 'tsup'

export default defineConfig({
  clean: true,
  dts: {resolve: [/^prettier$/]},
  entry: ['src/index.ts'],
  external: ['eslint-config-prettier', 'eslint-plugin-prettier'],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  target: 'esnext',
})
