/**
 * Tests for utils barrel exports
 * Validates that the barrel file properly re-exports utilities with correct functionality
 */

import {existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {isErr, isOk} from '@bfra.me/es/result'
import {describe, expect, it} from 'vitest'
import * as utils from '../../src/utils/index.js'

describe('utils/index barrel exports', () => {
  describe('command-options', () => {
    it.concurrent('validateCreateCommandOptions validates valid options', () => {
      const result = utils.validateCreateCommandOptions({
        name: 'test-project',
        template: 'default',
        outputDir: '/tmp/test',
      })
      expect(isOk(result)).toBe(true)
    })

    it.concurrent('parseFeatures splits comma-separated feature strings', () => {
      const features = utils.parseFeatures('eslint,prettier,vitest')
      expect(features).toEqual(['eslint', 'prettier', 'vitest'])
    })

    it.concurrent('ConfigurationPresets contains expected presets', () => {
      expect(utils.ConfigurationPresets).toHaveProperty('minimal')
      expect(utils.ConfigurationPresets).toHaveProperty('standard')
      expect(utils.ConfigurationPresets).toHaveProperty('full')
    })
  })

  describe('constants', () => {
    it.concurrent('RESERVED_PACKAGE_NAMES contains expected values', () => {
      expect(utils.RESERVED_PACKAGE_NAMES).toContain('node_modules')
      expect(utils.RESERVED_PACKAGE_NAMES).toContain('package.json')
    })

    it.concurrent('BUILTIN_NODE_MODULES contains expected values', () => {
      expect(utils.BUILTIN_NODE_MODULES).toContain('fs')
      expect(utils.BUILTIN_NODE_MODULES).toContain('path')
      expect(utils.BUILTIN_NODE_MODULES).toContain('http')
    })

    it.concurrent('isReservedName identifies reserved package names', () => {
      expect(utils.isReservedName('node_modules')).toBe(true)
      expect(utils.isReservedName('my-package')).toBe(false)
    })

    it.concurrent('isBuiltinModule identifies Node.js builtin modules', () => {
      expect(utils.isBuiltinModule('fs')).toBe(true)
      expect(utils.isBuiltinModule('custom-module')).toBe(false)
    })
  })

  describe('error utilities', () => {
    it.concurrent('createCLIError creates properly structured error', () => {
      const error = utils.createCLIError('Test error', utils.CLIErrorCode.VALIDATION_FAILED)
      expect(error.code).toBe(utils.CLIErrorCode.VALIDATION_FAILED)
      expect(error.message).toBe('Test error')
    })

    it.concurrent('validationFailedError creates validation error with details', () => {
      const error = utils.validationFailedError('Invalid input', ['error1', 'error2'])
      expect(error.code).toBe('VALIDATION_FAILED')
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_FAILED')
      expect('details' in error ? error.details : undefined).toEqual(['error1', 'error2'])
    })

    it.concurrent('isBaseError identifies error objects', () => {
      const error = utils.createCLIError('Test', utils.CLIErrorCode.INVALID_INPUT)
      expect(utils.isBaseError(error)).toBe(true)
      expect(utils.isBaseError(new Error('standard'))).toBe(false)
    })

    it.concurrent('hasErrorCode checks error code correctly', () => {
      const error = utils.createCLIError('Test', utils.CLIErrorCode.INVALID_INPUT)
      expect(utils.hasErrorCode(error, utils.CLIErrorCode.INVALID_INPUT)).toBe(true)
      expect(utils.hasErrorCode(error, utils.CLIErrorCode.VALIDATION_FAILED)).toBe(false)
    })
  })

  describe('file system utilities', () => {
    it.concurrent('exists checks file existence', () => {
      const tmpDir = tmpdir()
      expect(utils.exists(tmpDir)).toBe(true)
      expect(utils.exists('/nonexistent/path/12345')).toBe(false)
    })

    it.concurrent('isDirectory identifies directories', () => {
      const tmpDir = tmpdir()
      expect(utils.isDirectory(tmpDir)).toBe(true)
    })

    it.concurrent('getRelativePath computes relative paths', () => {
      const from = '/home/user/project'
      const to = '/home/user/project/src/index.ts'
      expect(utils.getRelativePath(from, to)).toBe('src/index.ts')
    })

    it.concurrent('resolvePath resolves path segments', () => {
      const resolved = utils.resolvePath('/home', 'user', 'project')
      expect(resolved).toBe(join('/home', 'user', 'project'))
    })

    it.concurrent('toUnixPath converts backslashes to forward slashes', () => {
      const normalized = utils.toUnixPath(String.raw`path\to\file`)
      expect(normalized).toBe('path/to/file')
    })
  })

  describe('help system', () => {
    it.concurrent('HelpSystem class is accessible', () => {
      expect(typeof utils.HelpSystem).toBe('function')
      expect(utils.helpSystem).toBeInstanceOf(utils.HelpSystem)
    })

    it.concurrent('helpSystem singleton provides command help', () => {
      expect(utils.helpSystem).toBeDefined()
      expect(typeof utils.helpSystem.getCommandHelp).toBe('function')
      const helpResult = utils.helpSystem.getCommandHelp('create')
      expect(helpResult).toBeDefined()
    })
  })

  describe('logger utilities', () => {
    it.concurrent('createLogger returns logger instance', () => {
      const logger = utils.createLogger({tag: 'test'})
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })

    it.concurrent('logger functions are callable', () => {
      expect(typeof utils.logInfo).toBe('function')
      expect(typeof utils.logError).toBe('function')
      expect(typeof utils.logWarning).toBe('function')
      expect(typeof utils.logSuccess).toBe('function')
    })
  })

  describe('progress utilities', () => {
    it.concurrent('ProgressTracker creates instance with total steps', () => {
      const tracker = new utils.ProgressTracker(3)
      expect(tracker).toBeInstanceOf(utils.ProgressTracker)
    })

    it.concurrent('estimateOperationTime returns reasonable estimates', () => {
      const estimate = utils.estimateOperationTime('download', 100)
      expect(typeof estimate).toBe('number')
      expect(estimate).toBeGreaterThan(0)
    })
  })

  describe('project detection utilities', () => {
    it.concurrent('isNodeProject checks for package.json', () => {
      const hasPackageJson = existsSync(join(process.cwd(), 'package.json'))
      expect(utils.isNodeProject(process.cwd())).toBe(hasPackageJson)
    })

    it.concurrent('isTypeScriptProject checks for tsconfig.json', () => {
      const hasTsConfig = existsSync(join(process.cwd(), 'tsconfig.json'))
      expect(utils.isTypeScriptProject(process.cwd())).toBe(hasTsConfig)
    })

    it.concurrent('analyzeProject returns project metadata', async () => {
      const analysis = await utils.analyzeProject(process.cwd())
      expect(analysis).toHaveProperty('type')
      expect(analysis).toHaveProperty('packageManager')
    })
  })

  describe('type guards', () => {
    it.concurrent('isPackageManager validates package manager names', () => {
      expect(utils.isPackageManager('npm')).toBe(true)
      expect(utils.isPackageManager('pnpm')).toBe(true)
      expect(utils.isPackageManager('yarn')).toBe(true)
      expect(utils.isPackageManager('invalid')).toBe(false)
    })

    it.concurrent('isTemplateSource validates template source strings', () => {
      expect(utils.isTemplateSource('default')).toBe(true)
      expect(utils.isTemplateSource('')).toBe(false)
    })

    it.concurrent('createTemplateSource creates branded template source', () => {
      const source = utils.createTemplateSource('my-template')
      expect(source).toBe('my-template')
    })

    it.concurrent('isTemplateMetadata validates metadata objects', () => {
      const validMetadata = {
        name: 'test',
        description: 'A test template',
        version: '1.0.0',
      }
      expect(utils.isTemplateMetadata(validMetadata)).toBe(true)
      expect(utils.isTemplateMetadata({})).toBe(false)
    })
  })

  describe('validation factory', () => {
    it.concurrent('validateProjectName validates project names', () => {
      const validResult = utils.validateProjectName('my-project')
      expect(isOk(validResult)).toBe(true)

      const invalidResult = utils.validateProjectName('')
      expect(isErr(invalidResult)).toBe(true)
    })

    it.concurrent('validatePackageManager validates package managers', () => {
      const validResult = utils.validatePackageManager('npm')
      expect(isOk(validResult)).toBe(true)

      const invalidResult = utils.validatePackageManager('invalid')
      expect(isErr(invalidResult)).toBe(true)
    })

    it.concurrent('validateSemver validates semantic versions', () => {
      const validResult = utils.validateSemver('1.0.0')
      expect(isOk(validResult)).toBe(true)

      const invalidResult = utils.validateSemver('invalid')
      expect(isErr(invalidResult)).toBe(true)
    })

    it.concurrent('validateEmailAddress validates email addresses', () => {
      const validResult = utils.validateEmailAddress('user@example.com')
      expect(isOk(validResult)).toBe(true)

      const invalidResult = utils.validateEmailAddress('invalid-email')
      expect(isErr(invalidResult)).toBe(true)
    })
  })

  describe('validation utilities', () => {
    it.concurrent('ValidationUtils validates project names', () => {
      const result = utils.ValidationUtils.validateProjectName('my-project')
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it.concurrent('ValidationUtils rejects invalid project names', () => {
      const result = utils.ValidationUtils.validateProjectName('')
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it.concurrent('ValidationUtils validates output directories', () => {
      const result = utils.ValidationUtils.validateOutputDirectory('/tmp/test-dir')
      expect(result.valid).toBe(true)
    })
  })
})
