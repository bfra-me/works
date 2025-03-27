import {defineConfig} from 'tsup'

export default defineConfig([
  {
    entry: ['src/{index,cli}.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
  },
])
