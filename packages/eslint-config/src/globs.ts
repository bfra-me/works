export const GLOB_SRC_EXT = '?([cm])[jt]s?(x)'
export const GLOB_SRC = '**/*.?([cm])[jt]s?(x)'

export const GLOB_JSX = '**/*.?([cm])jsx'

export const GLOB_TS = '**/*.?([cm])ts'
export const GLOB_TSX = '**/*.tsx'

export const GLOB_JSON = '**/*.json'
export const GLOB_JSON5 = '**/*.json5'
export const GLOB_JSONC = '**/*.jsonc'
export const GLOB_JSON_FILES = ['*.json', '*.json5', '*.jsonc'].flatMap(p => [p, `**/${p}`])
export const GLOB_TOML = '**/*.toml'
export const GLOB_TOML_FILES = ['*.toml'].flatMap(p => [p, `**/${p}`])
export const GLOB_YAML = '**/*.y?(a)ml'
export const GLOB_YAML_FILES = ['*.yaml', '*.yml'].flatMap(p => [p, `**/${p}`])

export const GLOB_MARKDOWN = '**/*.md'
export const GLOB_MARKDOWN_FILES = ['*.markdown', '*.md'].flatMap(p => [p, `**/${p}`])
export const GLOB_MARKDOWN_CODE = `${GLOB_MARKDOWN}/${GLOB_SRC}`
export const GLOB_CODE_IN_MARKDOWN_FILES = GLOB_MARKDOWN_FILES.flatMap(p => [
  `${p}/*.js`,
  `${p}/*.jsx`,
  `${p}/*.cjs`,
  `${p}/*.mjs`,
  `${p}/*.ts`,
  `${p}/*.tsx`,
  `${p}/*.cts`,
  `${p}/*.mts`,
])
export const GLOB_EXT_IN_MARKDOWN_FILES = [
  ...GLOB_CODE_IN_MARKDOWN_FILES,
  ...GLOB_MARKDOWN_FILES.flatMap(p => [
    `${p}/*.json`,
    `${p}/*.json5`,
    `${p}/*.jsonc`,
    `${p}/*.toml`,
    `${p}/*.yml`,
    `${p}/*.yaml`,
    `${p}/*.vue`,
    `${p}/*.svelte`,
    `${p}/*.astro`,
  ]),
]
export const GLOB_MARKDOWN_IN_MARKDOWN = '**/*.md/*.md'

export const GLOB_ASTRO = '**/*.astro'
export const GLOB_ASTRO_TS = `${GLOB_ASTRO}/*.ts`

export const GLOB_PACKAGE_JSON_FILES = ['package.json', 'package.json5', 'package.jsonc'].flatMap(
  file => [file, `**/${file}`],
)

export const GLOB_RENOVATE_CONFIG = [
  '**/renovate.json',
  '**/renovate.json5',
  '**/.renovaterc',
  '**/.renovaterc.json',
  '**/.renovaterc.json5',
]

export const GLOB_TS_CONFIG = ['**/[t]sconfig.json', '**/[jt]sconfig.*.json']

export const GLOB_TESTS = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.spec.${GLOB_SRC_EXT}`,
  `**/*.test.${GLOB_SRC_EXT}`,
  `**/*.bench.${GLOB_SRC_EXT}`,
  `**/*.benchmark.${GLOB_SRC_EXT}`,
]

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
