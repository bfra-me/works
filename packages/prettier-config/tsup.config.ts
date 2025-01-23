import {defineConfig} from 'tsup'

export default defineConfig([
  {
    bundle: false,
    clean: true,
    dts: true,
    entry: ['./src/index.ts'],
    format: ['esm'],
    outDir: 'lib',
    sourcemap: true,
    // Splitting can place code using `import.meta` into a separate chunk, which breaks the preset export mappings.
    splitting: false,
  },
  {
    entry: ['./prettier.config.cts'],
    format: ['cjs'],
    minify: true,
    // Bundle the config and dependencies into a single file.
    noExternal: [/^@bfra.me\//],
    outDir: '.',
    outExtension: () => ({js: '.cjs'}),
    shims: true,
    sourcemap: true,
    splitting: false,
  },
])
