import {describe, expect, it} from 'vitest'
import {normalizeCreateOptions} from '../../src/commands/shared-context.js'

describe('normalizeCreateOptions', () => {
  it('normalizes well-formed raw CLI options', () => {
    const result = normalizeCreateOptions('my-project', {
      template: 'library',
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
      outputDir: './my-project',
      packageManager: 'pnpm',
      skipPrompts: true,
      force: false,
      interactive: true,
      verbose: false,
      dryRun: false,
      cwd: '/tmp/my-project',
      templateRef: 'main',
      templateSubdir: 'templates/library',
      features: 'typescript,eslint',
      git: true,
      install: true,
      preset: 'standard',
      ai: true,
      describe: 'A TypeScript library',
    })

    expect(result).toMatchObject({
      name: 'my-project',
      template: 'library',
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
      outputDir: './my-project',
      packageManager: 'pnpm',
      skipPrompts: true,
      force: false,
      interactive: true,
      verbose: false,
      dryRun: false,
      cwd: '/tmp/my-project',
      templateRef: 'main',
      templateSubdir: 'templates/library',
      features: 'typescript,eslint',
      git: true,
      install: true,
      preset: 'standard',
      ai: true,
      describe: 'A TypeScript library',
    })
  })

  it('drops non-string values for string fields instead of leaking the wrong type', () => {
    const result = normalizeCreateOptions(undefined, {
      template: 123,
      description: {nested: true},
      author: ['not', 'a', 'string'],
      cwd: null,
    })

    expect(result.template).toBeUndefined()
    expect(result.description).toBeUndefined()
    expect(result.author).toBeUndefined()
    expect(result.cwd).toBeUndefined()
  })

  it('drops non-boolean values for boolean fields instead of leaking the wrong type', () => {
    const result = normalizeCreateOptions(undefined, {
      skipPrompts: 'yes',
      force: 1,
      verbose: 'true',
      dryRun: 0,
      ai: 'enabled',
    })

    expect(result.skipPrompts).toBeUndefined()
    expect(result.force).toBeUndefined()
    expect(result.verbose).toBeUndefined()
    expect(result.dryRun).toBeUndefined()
    expect(result.ai).toBeUndefined()
  })

  it('drops an unrecognized packageManager value instead of leaking it through', () => {
    const result = normalizeCreateOptions(undefined, {
      packageManager: 'nom',
    })

    expect(result.packageManager).toBeUndefined()
  })

  it('drops an unrecognized preset value instead of leaking it through', () => {
    const result = normalizeCreateOptions(undefined, {
      preset: 'extreme',
    })

    expect(result.preset).toBeUndefined()
  })

  it('treats any non-false value as truthy for interactive/git/install flags', () => {
    const result = normalizeCreateOptions(undefined, {
      interactive: 'anything',
      git: undefined,
      install: 0,
    })

    expect(result.interactive).toBe(true)
    expect(result.git).toBe(true)
    expect(result.install).toBe(true)
  })

  it('normalizes an empty features string to an empty string', () => {
    const result = normalizeCreateOptions(undefined, {})

    expect(result.features).toBe('')
  })
})
