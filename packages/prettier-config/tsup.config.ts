import {defineConfig} from 'tsup'

export default defineConfig({
  bundle: false,
  dts: true,
  entry: ['prettier.config.ts', '120-proof.ts', 'plugins.ts'],
  format: ['esm'],
  outDir: '.',
  sourcemap: true,
  splitting: false,
})
