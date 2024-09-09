// Based on https://github.com/antfu/eslint-config/blob/c8ac6da90c9479e9a431a3e2cd42d6c2b37dc333/test/fixtures.test.ts

import {join, resolve} from 'path'
import {execa} from 'execa'
import fg from 'fast-glob'
import {copy, existsSync, readFile, rm, writeFile} from 'fs-extra'
import {afterAll, beforeAll, it} from 'vitest'
import type Prettier from 'prettier'

const cleanup = async () => await rm('test/_fixtures', {force: true, recursive: true})

beforeAll(async () => {
  await cleanup()
})

afterAll(async () => {
  await cleanup()
})

testPreset('default')
testPreset('100-proof', '100-proof')
testPreset('120-proof', '120-proof')

testPreset('semi-120-proof', 'semi/120-proof')

function testPreset(name: string, preset?: string, ...configs: Prettier.Config[]) {
  it.concurrent(
    name,
    async ({expect}) => {
      const input = resolve('test/fixtures/input')
      const output = resolve('test/fixtures/output', name)
      const target = resolve('test/_fixtures', name)

      await copy(input, target, {filter: src => !src.includes('node_modules')})

      const config = join(target, 'prettier.config.js')
      await writeFile(
        config,
        `
import prettierConfig from '@bfra.me/prettier-config${preset ? `/${preset}` : ''}'

const config = {
  ...prettierConfig,
  ...${JSON.stringify(configs) ?? {}},
}

export default config
    `,
      )

      await execa('pnpx', ['prettier', '--write', '.'], {
        cwd: target,
        stdio: 'pipe',
      })

      const files = await fg('**/*', {
        cwd: target,
        ignore: ['prettier.config.js', 'node_modules'],
      })
      await Promise.all(
        files.map(async file => {
          const source = await readFile(join(input, file), 'utf-8')
          const actual = await readFile(join(target, file), 'utf-8')
          const snapshot = join(output, file)

          if (actual === source) {
            if (existsSync(snapshot)) {
              await rm(snapshot)
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