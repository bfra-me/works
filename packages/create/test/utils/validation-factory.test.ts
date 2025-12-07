/**
 * Tests for validation factory functions
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-033)
 */

import type {TemplateVariable} from '../../src/types.js'
import {isErr, isOk} from '@bfra.me/es/result'
import {describe, expect, it} from 'vitest'
import {
  createTemplateValidator,
  validateEmailAddress,
  validatePackageManager,
  validateProjectName,
  validateProjectPath,
  validateSemver,
  validateTemplateId,
  validateTemplateVariableValue,
} from '../../src/utils/validation-factory.js'

describe('validation factory functions', () => {
  describe('validateProjectName', () => {
    describe('valid names', () => {
      it.concurrent('accepts lowercase names', () => {
        const result = validateProjectName('my-project')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('my-project')
      })

      it.concurrent('accepts names with numbers', () => {
        const result = validateProjectName('project123')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts names with dots', () => {
        const result = validateProjectName('my.project')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts names with underscores', () => {
        const result = validateProjectName('my_project')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts scoped package names', () => {
        const result = validateProjectName('@scope/my-package')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('trims whitespace from names', () => {
        const result = validateProjectName('  my-project  ')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('my-project')
      })
    })

    describe('invalid names', () => {
      it.concurrent('rejects empty names', () => {
        const result = validateProjectName('')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects whitespace-only names', () => {
        const result = validateProjectName('   ')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects names starting with dot', () => {
        const result = validateProjectName('.my-project')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects names starting with underscore', () => {
        const result = validateProjectName('_my-project')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects names with uppercase letters', () => {
        const result = validateProjectName('MyProject')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects names with special characters', () => {
        const result = validateProjectName('my@project!')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects names exceeding max length', () => {
        const longName = 'a'.repeat(215)
        const result = validateProjectName(longName)
        expect(isErr(result)).toBe(true)
      })
    })

    describe('options', () => {
      it.concurrent('allows scoped packages by default', () => {
        const result = validateProjectName('@org/package')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('rejects scoped packages when allowScoped is false', () => {
        const result = validateProjectName('@org/package', {allowScoped: false})
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('respects custom maxLength', () => {
        const result = validateProjectName('my-project', {maxLength: 5})
        expect(isErr(result)).toBe(true)

        const validResult = validateProjectName('short', {maxLength: 10})
        expect(isOk(validResult)).toBe(true)
      })
    })
  })

  describe('validateProjectPath', () => {
    describe('valid paths', () => {
      it.concurrent('accepts relative paths', () => {
        const result = validateProjectPath('./my-project')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts absolute paths', () => {
        const result = validateProjectPath('/home/user/projects')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts simple directory names', () => {
        const result = validateProjectPath('my-project')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts nested paths', () => {
        const result = validateProjectPath('parent/child/grandchild')
        expect(isOk(result)).toBe(true)
      })
    })

    describe('invalid paths', () => {
      it.concurrent('rejects empty paths', () => {
        const result = validateProjectPath('')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects whitespace-only paths', () => {
        const result = validateProjectPath('   ')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects paths with null bytes', () => {
        const result = validateProjectPath('path\0with\0nulls')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects path traversal attempts', () => {
        const result = validateProjectPath('../../../etc/passwd')
        expect(isErr(result)).toBe(true)
      })
    })

    describe('options', () => {
      it.concurrent('allows relative paths by default', () => {
        const result = validateProjectPath('./relative-path')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('rejects relative paths when allowRelative is false', () => {
        const result = validateProjectPath('./relative-path', {allowRelative: false})
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('accepts absolute paths when allowRelative is false', () => {
        const result = validateProjectPath('/absolute/path', {allowRelative: false})
        expect(isOk(result)).toBe(true)
      })
    })
  })

  describe('validateTemplateId', () => {
    describe('valid template identifiers', () => {
      it.concurrent('accepts builtin template names', () => {
        const result = validateTemplateId('default')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts GitHub repository format', () => {
        const result = validateTemplateId('user/repo')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts GitHub org/repo format', () => {
        const result = validateTemplateId('bfra-me/works')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts HTTPS URLs', () => {
        const result = validateTemplateId('https://github.com/user/repo')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts SSH protocol URLs', () => {
        const result = validateTemplateId('ssh://git@github.com/user/repo.git')
        expect(isOk(result)).toBe(true)
      })
    })

    describe('invalid template identifiers', () => {
      it.concurrent('rejects empty identifiers', () => {
        const result = validateTemplateId('')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects whitespace-only identifiers', () => {
        const result = validateTemplateId('   ')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects path traversal attempts', () => {
        const result = validateTemplateId('../../../malicious')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects invalid URL protocols', () => {
        const result = validateTemplateId('ftp://invalid-protocol.com/template')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects incomplete GitHub format', () => {
        const result = validateTemplateId('user/')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects Git SSH shorthand format', () => {
        // Git SSH shorthand (git@host:path) contains special characters that fail GitHub validation
        const result = validateTemplateId('git@github.com:user/repo.git')
        expect(isErr(result)).toBe(true)
      })
    })

    describe('sanitization', () => {
      it.concurrent('trims whitespace from identifiers', () => {
        const result = validateTemplateId('  user/repo  ')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('user/repo')
      })
    })
  })

  describe('validateEmailAddress', () => {
    describe('valid emails', () => {
      it.concurrent('accepts standard email format', () => {
        const result = validateEmailAddress('user@example.com')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts email with subdomain', () => {
        const result = validateEmailAddress('user@mail.example.com')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts email with plus sign', () => {
        const result = validateEmailAddress('user+tag@example.com')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('returns empty string for empty input', () => {
        const result = validateEmailAddress('')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('')
      })
    })

    describe('invalid emails', () => {
      it.concurrent('rejects email without @', () => {
        const result = validateEmailAddress('userexample.com')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects email without domain', () => {
        const result = validateEmailAddress('user@')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects email without local part', () => {
        const result = validateEmailAddress('@example.com')
        expect(isErr(result)).toBe(true)
      })
    })
  })

  describe('validateSemver', () => {
    describe('valid versions', () => {
      it.concurrent('accepts standard semver', () => {
        const result = validateSemver('1.0.0')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts prerelease versions', () => {
        const result = validateSemver('1.0.0-alpha.1')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts versions with build metadata', () => {
        const result = validateSemver('1.0.0+build.123')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('returns default version for empty input', () => {
        const result = validateSemver('')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('1.0.0')
      })
    })

    describe('invalid versions', () => {
      it.concurrent('rejects non-semver format', () => {
        const result = validateSemver('version1')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects incomplete versions', () => {
        const result = validateSemver('1.0')
        expect(isErr(result)).toBe(true)
      })
    })
  })

  describe('validatePackageManager', () => {
    describe('valid package managers', () => {
      it.concurrent('accepts npm', () => {
        const result = validatePackageManager('npm')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('npm')
      })

      it.concurrent('accepts yarn', () => {
        const result = validatePackageManager('yarn')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts pnpm', () => {
        const result = validatePackageManager('pnpm')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts bun', () => {
        const result = validatePackageManager('bun')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('handles case insensitivity', () => {
        const result = validatePackageManager('NPM')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('npm')
      })
    })

    describe('invalid package managers', () => {
      it.concurrent('rejects unknown package managers', () => {
        const result = validatePackageManager('pip')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects empty string', () => {
        const result = validatePackageManager('')
        expect(isErr(result)).toBe(true)
      })
    })
  })

  describe('validateTemplateVariableValue', () => {
    describe('string variables', () => {
      const stringVariable: TemplateVariable = {
        name: 'projectName',
        description: 'Project name',
        type: 'string',
        required: true,
      }

      it.concurrent('accepts valid string values', () => {
        const result = validateTemplateVariableValue(stringVariable, 'my-project')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('rejects non-string values for string type', () => {
        const result = validateTemplateVariableValue(stringVariable, 123)
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects empty required string', () => {
        const result = validateTemplateVariableValue(stringVariable, '')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('validates pattern when specified', () => {
        const patternVar: TemplateVariable = {
          name: 'version',
          description: 'Version',
          type: 'string',
          required: true,
          pattern: String.raw`^\d+\.\d+\.\d+$`,
        }

        const valid = validateTemplateVariableValue(patternVar, '1.0.0')
        expect(isOk(valid)).toBe(true)

        const invalid = validateTemplateVariableValue(patternVar, 'not-a-version')
        expect(isErr(invalid)).toBe(true)
      })
    })

    describe('boolean variables', () => {
      const boolVariable: TemplateVariable = {
        name: 'typescript',
        description: 'Use TypeScript',
        type: 'boolean',
        required: true,
      }

      it.concurrent('accepts true', () => {
        const result = validateTemplateVariableValue(boolVariable, true)
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts false', () => {
        const result = validateTemplateVariableValue(boolVariable, false)
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('rejects non-boolean values', () => {
        const result = validateTemplateVariableValue(boolVariable, 'true')
        expect(isErr(result)).toBe(true)
      })
    })

    describe('number variables', () => {
      const numberVariable: TemplateVariable = {
        name: 'port',
        description: 'Server port',
        type: 'number',
        required: true,
      }

      it.concurrent('accepts valid numbers', () => {
        const result = validateTemplateVariableValue(numberVariable, 3000)
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('accepts string numbers and converts them', () => {
        const result = validateTemplateVariableValue(numberVariable, '3000')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe(3000)
      })

      it.concurrent('rejects non-numeric strings', () => {
        const result = validateTemplateVariableValue(numberVariable, 'not-a-number')
        expect(isErr(result)).toBe(true)
      })
    })

    describe('select variables', () => {
      const selectVariable: TemplateVariable = {
        name: 'framework',
        description: 'Framework choice',
        type: 'select',
        required: true,
        options: ['react', 'vue', 'angular'],
      }

      it.concurrent('accepts valid options', () => {
        const result = validateTemplateVariableValue(selectVariable, 'react')
        expect(isOk(result)).toBe(true)
      })

      it.concurrent('rejects invalid options', () => {
        const result = validateTemplateVariableValue(selectVariable, 'svelte')
        expect(isErr(result)).toBe(true)
      })

      it.concurrent('rejects non-string values', () => {
        const result = validateTemplateVariableValue(selectVariable, 123)
        expect(isErr(result)).toBe(true)
      })
    })

    describe('optional variables', () => {
      const optionalVariable: TemplateVariable = {
        name: 'description',
        description: 'Project description',
        type: 'string',
        required: false,
        default: 'A new project',
      }

      it.concurrent('returns default for undefined', () => {
        const result = validateTemplateVariableValue(optionalVariable, undefined)
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('A new project')
      })

      it.concurrent('returns default for null', () => {
        const result = validateTemplateVariableValue(optionalVariable, null)
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('A new project')
      })

      it.concurrent('returns default for empty string', () => {
        const result = validateTemplateVariableValue(optionalVariable, '')
        expect(isOk(result)).toBe(true)
        expect(isOk(result) && result.data).toBe('A new project')
      })
    })
  })

  describe('createTemplateValidator', () => {
    const variables: TemplateVariable[] = [
      {name: 'projectName', description: 'Project name', type: 'string', required: true},
      {
        name: 'description',
        description: 'Description',
        type: 'string',
        required: false,
        default: '',
      },
      {name: 'typescript', description: 'Use TypeScript', type: 'boolean', required: true},
    ]

    const validator = createTemplateValidator(variables)

    it.concurrent('validates all required fields', () => {
      const result = validator({
        projectName: 'my-project',
        typescript: true,
      })
      expect(isOk(result)).toBe(true)
    })

    it.concurrent('returns error for missing required fields', () => {
      const result = validator({
        projectName: 'my-project',
      })
      expect(isErr(result)).toBe(true)
    })

    it.concurrent('applies defaults for optional fields', () => {
      const result = validator({
        projectName: 'my-project',
        typescript: false,
      })
      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data.description).toBe('')
    })

    it.concurrent('collects multiple validation errors', () => {
      const result = validator({
        projectName: 123,
        typescript: 'yes',
      })
      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toContain('Template validation failed')
    })
  })
})
