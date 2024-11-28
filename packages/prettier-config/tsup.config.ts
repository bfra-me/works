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
    target: 'es2022',
  },
  {
    entry: ['./src/index.ts'],
    format: ['cjs'],
    minify: true,
    // Bundle the config and dependencies into a single file.
    noExternal: [/^@bfra.me\//],
    outDir: '.',
    shims: true,
    sourcemap: true,
    target: 'es2022',
    treeshake: 'safest',
  },
])
