// Based on https://github.com/antfu/eslint-config/blob/c8ac6da90c9479e9a431a3e2cd42d6c2b37dc333/test/fixtures.test.ts

import type {Config, Options} from '../src'
import {existsSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {execa} from 'execa'
import fg from 'fast-glob'
import fs from 'fs-extra'
import {afterAll, beforeAll, it} from 'vitest'

const pkgRoot = new URL('..', import.meta.url).pathname
const resolveFixture = (p: string, ...paths: string[]) => resolve(join(pkgRoot, p, ...paths))

const cleanup = async () => fs.rm('test/_fixtures', {force: true, recursive: true})

beforeAll(async () => {
  await cleanup()
})

afterAll(async () => {
  await cleanup()
})

function testPreset(name: string, options: Options, ...configs: Config[]) {
  it.concurrent(
    name,
    async ({expect}) => {
      const input = resolveFixture('test/fixtures/input')
      const output = resolveFixture('test/fixtures/output', name)
      const target = resolveFixture('test/_fixtures', name)

      await fs.copy(input, target, {filter: src => !src.includes('node_modules')})

      const config = join(target, 'eslint.config.js')
      await fs.writeFile(
        config,
        `
// @eslint-disable
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig(
  ${JSON.stringify(options)},
  ...${JSON.stringify(configs) ?? []},
)
`,
      )

      await execa('pnpm', ['eslint', '--fix', '.'], {
        cwd: target,
        stdio: 'pipe',
      })

      const files = await fg('**/*', {
        cwd: target,
        ignore: ['eslint.config.js', 'node_modules'],
      })
      await Promise.all(
        files.map(async file => {
          const source = await fs.readFile(join(input, file), 'utf-8')
          const actual = await fs.readFile(join(target, file), 'utf-8')
          const snapshot = join(output, file)

          if (actual === source) {
            if (existsSync(snapshot)) {
              await fs.rm(snapshot)
            }
            return
          }

          await expect.soft(actual).toMatchFileSnapshot(join(output, file))
        }),
      )
    },
    30_000,
  )
}

testPreset('default', {})

testPreset('js', {typescript: false})

testPreset('no-prettier', {prettier: false})

testPreset(
  'ts-override',
  {
    typescript: true,
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
  },
)

testPreset(
  'ts-strict',
  {
    typescript: {
      tsconfigPath: './tsconfig.json',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-return': ['off'],
    },
  },
)
