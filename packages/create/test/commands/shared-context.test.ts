import {describe, expect, it} from 'vitest'
import {
  normalizeCreateOptions,
  validateAndTransformOptions,
} from '../../src/commands/shared-context.js'

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

  it('drops genuinely non-string, non-numeric values for string fields instead of leaking the wrong type', () => {
    const result = normalizeCreateOptions(undefined, {
      description: {nested: true},
      author: ['not', 'a', 'string'],
      cwd: null,
    })

    expect(result.description).toBeUndefined()
    expect(result.author).toBeUndefined()
    expect(result.cwd).toBeUndefined()
  })

  it('keeps numeric CLI values (coerced by cac/mri) as strings for string fields', () => {
    // cac's mri parser coerces numeric-looking option values to numbers before
    // this code ever sees them, e.g. `--template 123` yields `{template: 123}`.
    const result = normalizeCreateOptions(undefined, {
      template: 123,
      version: 1,
      description: 2024,
      author: 42,
      outputDir: 1,
      cwd: 5,
      templateRef: 2,
      templateSubdir: 3,
      describe: 6,
    })

    expect(result.template).toBe('123')
    expect(result.version).toBe('1')
    expect(result.description).toBe('2024')
    expect(result.author).toBe('42')
    expect(result.outputDir).toBe('1')
    expect(result.cwd).toBe('5')
    expect(result.templateRef).toBe('2')
    expect(result.templateSubdir).toBe('3')
    expect(result.describe).toBe('6')
  })

  it('drops genuinely non-boolean values for boolean fields instead of leaking the wrong type', () => {
    const result = normalizeCreateOptions(undefined, {
      skipPrompts: 'yes',
      force: 1,
      dryRun: 0,
      ai: 'enabled',
    })

    expect(result.skipPrompts).toBeUndefined()
    expect(result.force).toBeUndefined()
    expect(result.dryRun).toBeUndefined()
    expect(result.ai).toBeUndefined()
  })

  it('coerces "true"/"false" string values to real booleans for boolean fields', () => {
    // cac only coerces "true"/"false" strings to real booleans for single-word
    // boolean flags (e.g. `--force false`); hyphenated multi-word flags like
    // `--skip-prompts false` and `--dry-run false` are left as literal strings.
    const result = normalizeCreateOptions(undefined, {
      skipPrompts: 'false',
      dryRun: 'true',
      verbose: 'true',
      force: 'false',
      ai: 'true',
    })

    expect(result.skipPrompts).toBe(false)
    expect(result.dryRun).toBe(true)
    expect(result.verbose).toBe(true)
    expect(result.force).toBe(false)
    expect(result.ai).toBe(true)
  })

  it('throws the existing validation error for an unrecognized packageManager value instead of silently dropping it', () => {
    expect(() => normalizeCreateOptions(undefined, {packageManager: 'nom'})).toThrow(
      'Invalid package manager. Must be one of: npm, yarn, pnpm, bun',
    )
  })

  it('throws the existing validation error for an unrecognized preset value instead of silently dropping it', () => {
    expect(() => normalizeCreateOptions(undefined, {preset: 'extreme'})).toThrow(
      'Invalid preset: extreme. Must be one of: minimal, standard, full',
    )
  })

  it('normalizes packageManager casing and whitespace the same way validatePackageManager does', () => {
    expect(normalizeCreateOptions(undefined, {packageManager: 'PNPM'}).packageManager).toBe('pnpm')
    expect(normalizeCreateOptions(undefined, {packageManager: ' pnpm '}).packageManager).toBe(
      'pnpm',
    )
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

describe('validateAndTransformOptions', () => {
  it('returns the existing Invalid preset validation error for a typo in preset', () => {
    const result = validateAndTransformOptions({preset: 'stadnard'})

    expect(result).toMatchObject({
      success: false,
      error: expect.objectContaining({
        message: 'Invalid preset: stadnard. Must be one of: minimal, standard, full',
      }),
    })
  })

  it('returns the existing Invalid package manager validation error for a typo in packageManager', () => {
    const result = validateAndTransformOptions({packageManager: 'nom'})

    expect(result).toMatchObject({
      success: false,
      error: expect.objectContaining({
        message: 'Invalid package manager. Must be one of: npm, yarn, pnpm, bun',
      }),
    })
  })

  it('resolves a mixed-case/whitespace packageManager to its normalized form', () => {
    const result = validateAndTransformOptions({packageManager: 'PNPM'})

    expect(result).toMatchObject({success: true, data: {packageManager: 'pnpm'}})
  })

  it('resolves a valid preset successfully', () => {
    const result = validateAndTransformOptions({preset: 'standard'})

    expect(result).toMatchObject({success: true, data: {preset: 'standard'}})
  })
})
