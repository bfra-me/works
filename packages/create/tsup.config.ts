import {defineConfig} from 'tsup'

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/cli.ts',
      'src/types.ts',
      'src/templates/resolver.ts',
      'src/templates/fetcher.ts',
      'src/templates/processor.ts',
      'src/templates/metadata.ts',
      'src/templates/validator.ts',
      'src/utils/index.ts',
    ],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // Preserve directory structure for better imports
    outDir: 'dist',
    // Ensure proper module resolution
    splitting: false,
    // Copy template files to dist
    onSuccess: async () => {
      const {cp} = await import('node:fs/promises')
      const {existsSync} = await import('node:fs')

      // Copy built-in templates to dist
      if (existsSync('src/templates/default')) {
        await cp('src/templates/default', 'dist/templates/default', {
          recursive: true,
          force: true,
        }).catch(() => {
          // Ignore copy errors for now - templates may not exist yet
        })
      }
    },
  },
])
