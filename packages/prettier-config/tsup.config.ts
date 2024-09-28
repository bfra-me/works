import {defineConfig} from 'tsup'

export default defineConfig({
  bundle: false,
  clean: true,
  dts: true,
  entry: ['./src/*.ts'],
  format: ['esm'],
  outDir: 'lib',
  sourcemap: true,
  // Splitting can place code using `import.meta` into a separate chunk, which breaks the preset export mappings.
  splitting: false,
})
