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
      'src/utils/retry.ts',
      'src/utils/ui.ts',
      'src/prompts/project-setup.ts',
      'src/prompts/template-selection.ts',
      'src/prompts/customization.ts',
      'src/prompts/confirmation.ts',
      'src/utils/progress.ts',
      'src/utils/help.ts',
    ],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    // Preserve directory structure for better imports
    outDir: 'dist',
    // Ensure proper module resolution
    splitting: false,
    // Copy template files to dist from root-level templates/ directory
    onSuccess: async () => {
      const {cp} = await import('node:fs/promises')
      const {existsSync} = await import('node:fs')

      // Copy built-in templates from root-level templates/ directory to dist
      const templateDirs = ['default', 'library', 'cli', 'node', 'react']

      for (const templateDir of templateDirs) {
        const srcPath = `templates/${templateDir}`
        const distPath = `dist/templates/${templateDir}`

        if (existsSync(srcPath)) {
          await cp(srcPath, distPath, {
            recursive: true,
            force: true,
          }).catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error)
            console.warn(`Failed to copy template ${templateDir}:`, message)
          })
        }
      }
    },
  },
])
