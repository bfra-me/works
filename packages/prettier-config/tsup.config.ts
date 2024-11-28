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
    banner: {
      js: "import {createRequire}from'node:module';const require=createRequire(import.meta.url);",
    },
    entry: ['./src/prettier.config.ts'],
    format: ['esm'],
    minify: true,
    // Bundle the config and dependencies into a single file.
    noExternal: [/^@bfra.me\//],
    outDir: '.',
    sourcemap: true,
    target: 'es2022',
    treeshake: 'smallest',
  },
])
