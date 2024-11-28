import {defineConfig} from 'tsup'

export default defineConfig([
  {
    bundle: false,
    clean: true,
    dts: true,
    entry: ['./src/*.ts'],
    format: ['esm'],
    minify: true,
    outDir: 'lib',
    sourcemap: true,
    // Splitting can place code using `import.meta` into a separate chunk, which breaks the preset export mappings.
    splitting: false,
  },
  {
    entry: ['./src/index.ts'],
    format: ['esm'],
    minify: true,
    // Bundle the config and dependencies into a single file.
    noExternal: [/^@bfra.me\//, 'prettier'],
    outDir: '.',
    shims: true,
    sourcemap: true,
    splitting: false,
  },
])
