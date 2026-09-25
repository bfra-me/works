import {beforeEach, describe, expect, it, vi} from 'vitest'

const {isPackageInScopeMock} = vi.hoisted(() => ({
  isPackageInScopeMock: vi.fn<(name: string) => boolean>(),
}))

vi.mock('../src/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/utils')>()
  isPackageInScopeMock.mockImplementation(actual.isPackageInScope)
  return {
    ...actual,
    isPackageInScope: (name: string) => isPackageInScopeMock(name),
  }
})

const {prettier} = await import('../src/configs/prettier')

describe('prettier config', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('../src/utils')>('../src/utils')
    isPackageInScopeMock.mockImplementation(actual.isPackageInScope)
  })

  describe('toml support', () => {
    it('disables prettier/prettier for TOML files when prettier-plugin-toml is not installed', async () => {
      const configs = await prettier()
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(tomlConfig?.rules?.['prettier/prettier']).toBe('off')
    })

    it('enables prettier/prettier with the toml parser and plugin when prettier-plugin-toml is installed', async () => {
      const actual = await vi.importActual<typeof import('../src/utils')>('../src/utils')
      isPackageInScopeMock.mockImplementation(
        name => name === 'prettier-plugin-toml' || actual.isPackageInScope(name),
      )

      const configs = await prettier()
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(tomlConfig?.rules?.['prettier/prettier']).toEqual([
        'error',
        {parser: 'toml', plugins: ['prettier-plugin-toml']},
      ])
    })

    it('uses a warning severity in editor mode when prettier-plugin-toml is installed', async () => {
      const actual = await vi.importActual<typeof import('../src/utils')>('../src/utils')
      isPackageInScopeMock.mockImplementation(
        name => name === 'prettier-plugin-toml' || actual.isPackageInScope(name),
      )

      const configs = await prettier({isInEditor: true})
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(tomlConfig?.rules?.['prettier/prettier']).toEqual([
        'warn',
        {parser: 'toml', plugins: ['prettier-plugin-toml']},
      ])
    })
  })
})
