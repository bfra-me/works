import {describe, expect, it} from 'vitest'
import * as utils from '../../src/utils/index.js'

describe('utils/index', () => {
  it('should export command-options utilities', () => {
    expect(utils.validateCreateCommandOptions).toBeDefined()
    expect(utils.parseFeatures).toBeDefined()
    expect(utils.applyConfigurationPreset).toBeDefined()
  })

  it('should export constants', () => {
    expect(utils.RESERVED_PACKAGE_NAMES).toBeDefined()
    expect(utils.BUILTIN_NODE_MODULES).toBeDefined()
    expect(utils.isReservedName).toBeDefined()
    expect(utils.isBuiltinModule).toBeDefined()
  })

  it('should export error utilities', () => {
    expect(utils.createCLIError).toBeDefined()
    expect(utils.CLIErrorCode).toBeDefined()
  })

  it('should export file system utilities', () => {
    expect(utils.ensureDir).toBeDefined()
    expect(utils.copy).toBeDefined()
    expect(utils.exists).toBeDefined()
    expect(utils.isDirectory).toBeDefined()
    expect(utils.isFile).toBeDefined()
  })

  it('should export help utilities', () => {
    expect(utils.HelpSystem).toBeDefined()
    expect(utils.helpSystem).toBeDefined()
    expect(utils.showErrorHelp).toBeDefined()
  })

  it('should export logger utilities', () => {
    expect(utils.createLogger).toBeDefined()
    expect(utils.logError).toBeDefined()
    expect(utils.logInfo).toBeDefined()
    expect(utils.logSuccess).toBeDefined()
    expect(utils.logWarning).toBeDefined()
  })

  it('should export progress utilities', () => {
    expect(utils.ProgressTracker).toBeDefined()
  })

  it('should export project detection utilities', () => {
    expect(utils.analyzeProject).toBeDefined()
    expect(utils.isNodeProject).toBeDefined()
    expect(utils.isTypeScriptProject).toBeDefined()
  })

  it('should export type guard utilities', () => {
    expect(utils.isPackageManager).toBeDefined()
    expect(utils.isTemplateMetadata).toBeDefined()
    expect(utils.isTemplateSource).toBeDefined()
  })

  it('should export validation factory utilities', () => {
    expect(utils.validateProjectName).toBeDefined()
    expect(utils.validatePackageManager).toBeDefined()
    expect(utils.validateSemver).toBeDefined()
  })

  it('should export validation utilities', () => {
    expect(utils.ValidationUtils).toBeDefined()
  })
})
