import {defineConfig} from 'tsup'

export default defineConfig({
  banner: {
    js: "import {createRequire} from 'node:module';const require=createRequire(import.meta.url);",
  },
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['eslint-config-prettier', 'eslint-plugin-prettier'],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  target: 'esnext',
})
