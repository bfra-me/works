export const GLOB_SRC_EXT = '?([cm])[jt]s?(x)'
export const GLOB_SRC = '**/*.?([cm])[jt]s?(x)'

export const GLOB_TS = '**/*.?([cm])ts'
export const GLOB_TSX = '**/*.tsx'

export const GLOB_EXCLUDE = [
  '**/node_modules',
  '**/dist',
  '**/coverage',
  '**/out',
  '**/temp',
  '**/.idea',
  '**/.next',
  '**/.nuxt',
  '**/.output',
  '**/.svelte-kit',
  '**/.tsup',
  '**/.vercel',
  '**/.vitepress/cache',
  '**/.vite-inspect',
  '**/.yarn',
  '**/__snapshots__',
  '**/test/fixtures',

  '**/auto-import?(s).d.ts',
  '**/.changeset/*.md',
  '**/CHANGELOG*.md',
  '**/changelog*.md',
  '**/components.d.ts',
  '**/devcontainer-lock.json',
  '**/LICENSE*',
  '**/license*',
  '**/*.min.*',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/typed-router.d.ts',
  '**/yarn.lock',
  '**/bun.lockb',
]

export const GLOB_TESTS = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`,
]