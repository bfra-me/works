import {resolve} from 'node:path'
import {ESLint} from 'eslint'
import {describe, expect, it, vi} from 'vitest'
import {defineConfig} from '../src'

vi.setConfig({testTimeout: 30000})

const packageRoot = new URL('..', import.meta.url).pathname
const filename = resolve(packageRoot, 'test/vitest.test.ts')
const tsconfigPath = resolve(packageRoot, 'tsconfig.json')
const source = `import {expect, vi} from 'vitest'

const mock = {method: vi.fn()}
expect(mock.method).toHaveBeenCalled()

class Service {
  method() {}
}

const service = new Service()
const unboundMethod = service.method
void unboundMethod
`

async function createESLint(): Promise<ESLint> {
  const config = await defineConfig({
    prettier: false,
    typescript: {tsconfigPath},
    vitest: true,
  })

  return new ESLint({
    ignore: false,
    overrideConfig: config,
    overrideConfigFile: true,
    ruleFilter: ({ruleId}) =>
      ruleId === '@typescript-eslint/unbound-method' || ruleId === 'vitest/unbound-method',
  })
}

describe('vitest type-aware rules', () => {
  it('does not report mock methods passed to expect matchers', async () => {
    const eslint = await createESLint()
    const [result] = await eslint.lintText(source, {filePath: filename})

    expect(result?.messages).not.toContainEqual(
      expect.objectContaining({
        line: 4,
        ruleId: 'vitest/unbound-method',
      }),
    )
    expect(result?.messages).not.toContainEqual(
      expect.objectContaining({
        line: 4,
        ruleId: '@typescript-eslint/unbound-method',
      }),
    )
  })

  it('reports genuine unbound methods outside assertions', async () => {
    const eslint = await createESLint()
    const [result] = await eslint.lintText(source, {filePath: filename})

    expect(result?.messages).toContainEqual(
      expect.objectContaining({
        line: 11,
        ruleId: 'vitest/unbound-method',
      }),
    )
  })
})
