// Based on https://github.com/antfu/eslint-config/blob/c8ac6da90c9479e9a431a3e2cd42d6c2b37dc333/test/fixtures.test.ts

import {join, resolve} from 'path'
import {execa} from 'execa'
import fg from 'fast-glob'
import {existsSync} from 'node:fs'
import fs from 'fs-extra'
import {afterAll, beforeAll, it} from 'vitest'
import {GLOB_TS, GLOB_TSX, type Config} from '@bfra.me/eslint-config'

const cleanup = () => fs.rm('test/_fixtures', {force: true, recursive: true})

beforeAll(async () => {
  await cleanup()
})

afterAll(async () => {
  await cleanup()
})

testPreset('default', {})

function testPreset(name: string, options: Record<string, unknown>, ...configs: Config[]) {
  it.concurrent(
    name,
    async ({expect}) => {
      const input = resolve('test/fixtures/input')
      const output = resolve('test/fixtures/output', name)
      const target = resolve('test/_fixtures', name)

      await fs.copy(input, target, {filter: src => !src.includes('node_modules')})

      const config = join(target, 'eslint.config.js')
      await fs.writeFile(
        config,
        `
// @eslint-disable
import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig(
  ${JSON.stringify(options)},
  {files: ['${GLOB_TS}', '${GLOB_TSX}'], rules: {'@typescript-eslint/explicit-function-return-type': 'off'}},
  ...${JSON.stringify(configs) ?? []},
)
`,
      )

      await execa('pnpx', ['eslint', '--fix', '.'], {
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
