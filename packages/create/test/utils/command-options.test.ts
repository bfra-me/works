import {describe, expect, it} from 'vitest'
import {
  AddCommandOptionDefinitions,
  applyConfigurationPreset,
  CommonOptions,
  ConfigurationPresets,
  CreateCommandOptionDefinitions,
  mergeCommandOptions,
  parseFeatures,
  validateCreateCommandOptions,
  validateFeatureName,
} from '../../src/utils/command-options.js'

describe('CommonOptions', () => {
  it('should have verbose option', () => {
    expect(CommonOptions.verbose).toBeDefined()
    expect(CommonOptions.verbose.flags).toBe('--verbose')
    expect(CommonOptions.verbose.description).toContain('verbose')
  })

  it('should have dryRun option', () => {
    expect(CommonOptions.dryRun).toBeDefined()
    expect(CommonOptions.dryRun.flags).toBe('--dry-run')
    expect(CommonOptions.dryRun.description).toContain('without making changes')
  })

  it('should have cwd option', () => {
    expect(CommonOptions.cwd).toBeDefined()
    expect(CommonOptions.cwd.flags).toBe('--cwd <dir>')
    expect(CommonOptions.cwd.description).toContain('directory')
  })
})

describe('CreateCommandOptionDefinitions', () => {
  it('should have template option', () => {
    expect(CreateCommandOptionDefinitions.template).toBeDefined()
    expect(CreateCommandOptionDefinitions.template.flags).toContain('--template')
  })

  it('should have description option', () => {
    expect(CreateCommandOptionDefinitions.description).toBeDefined()
    expect(CreateCommandOptionDefinitions.description.flags).toContain('--description')
  })

  it('should have author option', () => {
    expect(CreateCommandOptionDefinitions.author).toBeDefined()
    expect(CreateCommandOptionDefinitions.author.flags).toContain('--author')
  })

  it('should have version option with default', () => {
    expect(CreateCommandOptionDefinitions.version).toBeDefined()
    expect(CreateCommandOptionDefinitions.version.default).toBe('1.0.0')
  })

  it('should have outputDir option', () => {
    expect(CreateCommandOptionDefinitions.outputDir).toBeDefined()
    expect(CreateCommandOptionDefinitions.outputDir.flags).toContain('--output-dir')
  })

  it('should have packageManager option', () => {
    expect(CreateCommandOptionDefinitions.packageManager).toBeDefined()
    expect(CreateCommandOptionDefinitions.packageManager.description).toContain('npm')
    expect(CreateCommandOptionDefinitions.packageManager.description).toContain('pnpm')
  })

  it('should have skipPrompts option', () => {
    expect(CreateCommandOptionDefinitions.skipPrompts).toBeDefined()
    expect(CreateCommandOptionDefinitions.skipPrompts.flags).toBe('--skip-prompts')
  })

  it('should have force option', () => {
    expect(CreateCommandOptionDefinitions.force).toBeDefined()
    expect(CreateCommandOptionDefinitions.force.flags).toBe('--force')
  })

  it('should have interactive option', () => {
    expect(CreateCommandOptionDefinitions.interactive).toBeDefined()
    expect(CreateCommandOptionDefinitions.interactive.flags).toBe('--no-interactive')
  })

  it('should have features option', () => {
    expect(CreateCommandOptionDefinitions.features).toBeDefined()
    expect(CreateCommandOptionDefinitions.features.description).toContain('Comma-separated')
  })

  it('should have git option', () => {
    expect(CreateCommandOptionDefinitions.git).toBeDefined()
    expect(CreateCommandOptionDefinitions.git.flags).toBe('--no-git')
  })

  it('should have install option', () => {
    expect(CreateCommandOptionDefinitions.install).toBeDefined()
    expect(CreateCommandOptionDefinitions.install.flags).toBe('--no-install')
  })

  it('should have preset option', () => {
    expect(CreateCommandOptionDefinitions.preset).toBeDefined()
    expect(CreateCommandOptionDefinitions.preset.description).toContain('minimal')
    expect(CreateCommandOptionDefinitions.preset.description).toContain('standard')
  })

  it('should have ai option', () => {
    expect(CreateCommandOptionDefinitions.ai).toBeDefined()
    expect(CreateCommandOptionDefinitions.ai.description).toContain('AI-powered')
  })

  it('should have describe option', () => {
    expect(CreateCommandOptionDefinitions.describe).toBeDefined()
    expect(CreateCommandOptionDefinitions.describe.description).toContain('Natural language')
  })

  it('should have templateRef option', () => {
    expect(CreateCommandOptionDefinitions.templateRef).toBeDefined()
    expect(CreateCommandOptionDefinitions.templateRef.description).toContain('Git branch')
  })

  it('should have templateSubdir option', () => {
    expect(CreateCommandOptionDefinitions.templateSubdir).toBeDefined()
    expect(CreateCommandOptionDefinitions.templateSubdir.description).toContain('Subdirectory')
  })
})

describe('AddCommandOptionDefinitions', () => {
  it('should have skipConfirm option', () => {
    expect(AddCommandOptionDefinitions.skipConfirm).toBeDefined()
    expect(AddCommandOptionDefinitions.skipConfirm.flags).toBe('--skip-confirm')
  })

  it('should have list option', () => {
    expect(AddCommandOptionDefinitions.list).toBeDefined()
    expect(AddCommandOptionDefinitions.list.flags).toBe('--list')
    expect(AddCommandOptionDefinitions.list.description).toContain('List available')
  })
})

describe('validateCreateCommandOptions', () => {
  it('should validate valid options', () => {
    const result = validateCreateCommandOptions({
      name: 'my-project',
      template: 'library',
      version: '1.0.0',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.name).toBe('my-project')
  })

  it('should validate options without name', () => {
    const result = validateCreateCommandOptions({
      template: 'library',
    })

    expect(result.success).toBe(true)
  })

  it('should reject invalid project name', () => {
    const result = validateCreateCommandOptions({
      name: 'My Project With Spaces',
    })

    expect(result.success).toBe(false)
  })

  it('should reject invalid project name with uppercase', () => {
    const result = validateCreateCommandOptions({
      name: 'MyProject',
    })

    expect(result.success).toBe(false)
  })

  it('should validate valid package manager', () => {
    const result = validateCreateCommandOptions({
      packageManager: 'pnpm',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.packageManager).toBe('pnpm')
  })

  it('should reject invalid package manager', () => {
    const result = validateCreateCommandOptions({
      packageManager: 'invalid' as 'npm',
    })

    expect(result.success).toBe(false)
  })

  it('should validate valid version', () => {
    const result = validateCreateCommandOptions({
      version: '2.0.0',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.version).toBe('2.0.0')
  })

  it('should reject invalid version', () => {
    const result = validateCreateCommandOptions({
      version: 'not-a-version',
    })

    expect(result.success).toBe(false)
  })

  it('should validate valid preset', () => {
    const result = validateCreateCommandOptions({
      preset: 'minimal',
    })

    expect(result.success).toBe(true)
  })

  it('should reject invalid preset', () => {
    const result = validateCreateCommandOptions({
      preset: 'invalid' as 'minimal',
    })

    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('Invalid preset')
  })

  it('should reject AI without describe', () => {
    const result = validateCreateCommandOptions({
      ai: true,
    })

    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('AI features require')
  })

  it('should accept AI with describe', () => {
    const result = validateCreateCommandOptions({
      ai: true,
      describe: 'A React dashboard project',
    })

    expect(result.success).toBe(true)
  })

  it('should validate output directory', () => {
    const result = validateCreateCommandOptions({
      outputDir: './my-project',
    })

    expect(result.success).toBe(true)
  })

  it('should handle empty output directory', () => {
    const result = validateCreateCommandOptions({
      outputDir: '',
    })

    expect(result.success).toBe(true)
  })

  it('should handle whitespace-only output directory', () => {
    const result = validateCreateCommandOptions({
      outputDir: '   ',
    })

    expect(result.success).toBe(true)
  })

  it('should validate all valid presets', () => {
    const presets = ['minimal', 'standard', 'full'] as const
    for (const preset of presets) {
      const result = validateCreateCommandOptions({preset})
      expect(result.success).toBe(true)
    }
  })

  it('should handle empty name string', () => {
    const result = validateCreateCommandOptions({
      name: '',
    })

    expect(result.success).toBe(true)
  })

  it('should handle whitespace-only name', () => {
    const result = validateCreateCommandOptions({
      name: '   ',
    })

    expect(result.success).toBe(true)
  })
})

describe('parseFeatures', () => {
  it('should parse comma-separated features', () => {
    const features = parseFeatures('eslint,prettier,vitest')
    expect(features).toEqual(['eslint', 'prettier', 'vitest'])
  })

  it('should handle features with spaces', () => {
    const features = parseFeatures('eslint, prettier , vitest')
    expect(features).toEqual(['eslint', 'prettier', 'vitest'])
  })

  it('should return empty array for undefined', () => {
    const features = parseFeatures(undefined)
    expect(features).toEqual([])
  })

  it('should return empty array for empty string', () => {
    const features = parseFeatures('')
    expect(features).toEqual([])
  })

  it('should return empty array for whitespace-only string', () => {
    const features = parseFeatures('   ')
    expect(features).toEqual([])
  })

  it('should filter out empty features from extra commas', () => {
    const features = parseFeatures('eslint,,prettier,,,vitest,')
    expect(features).toEqual(['eslint', 'prettier', 'vitest'])
  })

  it('should handle single feature', () => {
    const features = parseFeatures('eslint')
    expect(features).toEqual(['eslint'])
  })
})

describe('ConfigurationPresets', () => {
  it('should have minimal preset', () => {
    const minimal = ConfigurationPresets.minimal
    expect(minimal).toBeDefined()
    expect(minimal?.template).toBe('minimal')
    expect(minimal?.git).toBe(false)
    expect(minimal?.install).toBe(false)
    expect(minimal?.interactive).toBe(false)
    expect(minimal?.verbose).toBe(false)
  })

  it('should have standard preset', () => {
    const standard = ConfigurationPresets.standard
    expect(standard).toBeDefined()
    expect(standard?.template).toBe('library')
    expect(standard?.git).toBe(true)
    expect(standard?.install).toBe(true)
    expect(standard?.interactive).toBe(true)
    expect(standard?.verbose).toBe(false)
  })

  it('should have full preset', () => {
    const full = ConfigurationPresets.full
    expect(full).toBeDefined()
    expect(full?.template).toBe('library')
    expect(full?.git).toBe(true)
    expect(full?.install).toBe(true)
    expect(full?.interactive).toBe(true)
    expect(full?.verbose).toBe(true)
  })
})

describe('applyConfigurationPreset', () => {
  it('should apply minimal preset', () => {
    const options = applyConfigurationPreset('minimal')

    expect(options.template).toBe('minimal')
    expect(options.git).toBe(false)
    expect(options.install).toBe(false)
    expect(options.interactive).toBe(false)
    expect(options.verbose).toBe(false)
  })

  it('should apply standard preset', () => {
    const options = applyConfigurationPreset('standard')

    expect(options.template).toBe('library')
    expect(options.git).toBe(true)
    expect(options.install).toBe(true)
    expect(options.interactive).toBe(true)
    expect(options.verbose).toBe(false)
  })

  it('should apply full preset', () => {
    const options = applyConfigurationPreset('full')

    expect(options.template).toBe('library')
    expect(options.git).toBe(true)
    expect(options.install).toBe(true)
    expect(options.interactive).toBe(true)
    expect(options.verbose).toBe(true)
  })

  it('should return empty object for undefined preset', () => {
    const options = applyConfigurationPreset(undefined)
    expect(options).toEqual({})
  })

  it('should return empty object for unknown preset', () => {
    const options = applyConfigurationPreset('unknown' as 'minimal')
    expect(options).toEqual({})
  })
})

describe('mergeCommandOptions', () => {
  it('should merge options with defaults', () => {
    const defaults = {
      verbose: false,
      interactive: true,
      template: 'default',
    }

    const provided = {
      verbose: true,
      template: 'library',
    }

    const merged = mergeCommandOptions(provided, defaults)

    expect(merged.verbose).toBe(true)
    expect('interactive' in merged && merged.interactive).toBe(true)
    expect(merged.template).toBe('library')
  })

  it('should override defaults with provided values', () => {
    const defaults = {name: 'default-name', version: '1.0.0'}
    const provided = {name: 'custom-name'}

    const merged = mergeCommandOptions(provided, defaults)

    expect(merged.name).toBe('custom-name')
    expect('version' in merged && merged.version).toBe('1.0.0')
  })

  it('should handle empty provided options', () => {
    const defaults = {name: 'default', template: 'library'}
    const merged = mergeCommandOptions({}, defaults)

    expect(merged.name).toBe('default')
    expect(merged.template).toBe('library')
  })

  it('should handle empty defaults', () => {
    const provided = {name: 'custom', template: 'cli'}
    const merged = mergeCommandOptions(provided, {})

    expect(merged.name).toBe('custom')
    expect(merged.template).toBe('cli')
  })
})

describe('validateFeatureName', () => {
  it('should validate lowercase feature names', () => {
    const result = validateFeatureName('eslint')
    expect(result.success).toBe(true)
    expect(result.success && result.data).toBe('eslint')
  })

  it('should validate feature names with numbers', () => {
    const result = validateFeatureName('vitest2')
    expect(result.success).toBe(true)
    expect(result.success && result.data).toBe('vitest2')
  })

  it('should validate feature names with hyphens', () => {
    const result = validateFeatureName('react-query')
    expect(result.success).toBe(true)
    expect(result.success && result.data).toBe('react-query')
  })

  it('should trim whitespace', () => {
    const result = validateFeatureName('  eslint  ')
    expect(result.success).toBe(true)
    expect(result.success && result.data).toBe('eslint')
  })

  it('should reject empty feature name', () => {
    const result = validateFeatureName('')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('required')
  })

  it('should reject whitespace-only feature name', () => {
    const result = validateFeatureName('   ')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('required')
  })

  it('should reject uppercase letters', () => {
    const result = validateFeatureName('ESLint')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('lowercase')
  })

  it('should reject spaces in feature name', () => {
    const result = validateFeatureName('react query')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('lowercase')
  })

  it('should reject special characters', () => {
    const result = validateFeatureName('eslint@latest')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('lowercase')
  })

  it('should reject underscores', () => {
    const result = validateFeatureName('react_query')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.message).toContain('lowercase')
  })
})
