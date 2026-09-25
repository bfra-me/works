import {beforeEach, describe, expect, it, vi} from 'vitest'

const {isPackageExistsMock} = vi.hoisted(() => ({
  isPackageExistsMock: vi.fn<(name: string) => boolean>(),
}))

vi.mock('local-pkg', async importOriginal => {
  const actual = await importOriginal<typeof import('local-pkg')>()
  isPackageExistsMock.mockImplementation(actual.isPackageExists)
  return {
    ...actual,
    isPackageExists: (name: string) => isPackageExistsMock(name),
  }
})

const {prettier} = await import('../src/configs/prettier')

describe('prettier config', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('local-pkg')>('local-pkg')
    isPackageExistsMock.mockImplementation(actual.isPackageExists)
  })

  describe('toml support', () => {
    it('disables prettier/prettier for TOML files when prettier-plugin-toml is not installed', async () => {
      const configs = await prettier()
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(tomlConfig?.rules?.['prettier/prettier']).toBe('off')
    })

    it('enables prettier/prettier with the toml parser and plugin when prettier-plugin-toml is installed', async () => {
      isPackageExistsMock.mockImplementation(name => name === 'prettier-plugin-toml')

      const configs = await prettier()
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(isPackageExistsMock).toHaveBeenCalledWith('prettier-plugin-toml')
      expect(tomlConfig?.rules?.['prettier/prettier']).toEqual([
        'error',
        {parser: 'toml', plugins: ['prettier-plugin-toml']},
      ])
    })

    it('uses a warning severity in editor mode when prettier-plugin-toml is installed', async () => {
      isPackageExistsMock.mockImplementation(name => name === 'prettier-plugin-toml')

      const configs = await prettier({isInEditor: true})
      const tomlConfig = configs.find(config => config.name === '@bfra.me/prettier/toml')

      expect(isPackageExistsMock).toHaveBeenCalledWith('prettier-plugin-toml')
      expect(tomlConfig?.rules?.['prettier/prettier']).toEqual([
        'warn',
        {parser: 'toml', plugins: ['prettier-plugin-toml']},
      ])
    })
  })
})
