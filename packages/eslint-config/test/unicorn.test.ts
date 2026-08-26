import {resolve} from 'node:path'
import {ESLint} from 'eslint'
import {describe, expect, it} from 'vitest'
import {defineConfig} from '../src'
import {unicorn} from '../src/configs/unicorn'
import {GLOB_JS, GLOB_JSX, GLOB_SRC} from '../src/globs'

const packageRoot = new URL('..', import.meta.url).pathname

async function createFilenameCaseESLint(): Promise<ESLint> {
  const config = await defineConfig({prettier: false})

  return new ESLint({
    cwd: packageRoot,
    ignore: false,
    overrideConfig: config,
    overrideConfigFile: true,
    ruleFilter: ({ruleId}) => ruleId === 'unicorn/filename-case',
  })
}

async function lintFilename(eslint: ESLint, filename: string) {
  const [result] = await eslint.lintText('export const value = 1\n', {
    filePath: resolve(packageRoot, filename),
  })

  return result?.messages.filter(({ruleId}) => ruleId === 'unicorn/filename-case') ?? []
}

describe('unicorn', () => {
  it('only applies rules to source files', async () => {
    const [config] = await unicorn()

    expect(config?.files).toEqual([GLOB_SRC])
  })

  it('does not configure TypeScript files when TypeScript is disabled', async () => {
    const config = await defineConfig({prettier: false, typescript: false})
    const unicornConfig = config.find(({name}) => name === '@bfra.me/unicorn')

    expect(unicornConfig?.files).toEqual([GLOB_JS, GLOB_JSX])
  }, 30_000)

  it('does not report non-kebab or pascal case directory names', async () => {
    const eslint = await createFilenameCaseESLint()

    for (const filename of [
      '__tests__/x.test.ts',
      'src/plugins/__tests__/x.test.ts',
      '__mocks__/x.test.ts',
      '__snapshots__/x.test.ts',
      '[...catchAll]/x.test.ts',
    ]) {
      await expect(lintFilename(eslint, filename)).resolves.toEqual([])
    }
  })

  it('still reports genuinely bad filenames', async () => {
    const eslint = await createFilenameCaseESLint()

    await expect(lintFilename(eslint, 'BadFile_Name.ts')).resolves.toContainEqual(
      expect.objectContaining({ruleId: 'unicorn/filename-case'}),
    )
  })
})
