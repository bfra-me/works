/**
 * Tests for type guards
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-033)
 */

import {describe, expect, it} from 'vitest'
import {
  createPackageName,
  createProjectPath,
  createTemplateSource,
  isPackageManager,
  isPackageName,
  isProjectPath,
  isProjectType,
  isTemplateMetadata,
  isTemplateSource,
  isTemplateSourceObject,
  isTemplateVariable,
} from '../../src/utils/type-guards.js'

describe('type guards', () => {
  describe('isTemplateSource', () => {
    it.concurrent('returns true for non-empty strings', () => {
      expect(isTemplateSource('default')).toBe(true)
      expect(isTemplateSource('user/repo')).toBe(true)
      expect(isTemplateSource('https://example.com')).toBe(true)
    })

    it.concurrent('returns false for empty strings', () => {
      expect(isTemplateSource('')).toBe(false)
      expect(isTemplateSource('   ')).toBe(false)
    })

    it.concurrent('returns false for non-strings', () => {
      expect(isTemplateSource(123)).toBe(false)
      expect(isTemplateSource(null)).toBe(false)
      expect(isTemplateSource(undefined)).toBe(false)
      expect(isTemplateSource({})).toBe(false)
    })
  })

  describe('createTemplateSource', () => {
    it.concurrent('creates branded template source for valid strings', () => {
      const source = createTemplateSource('my-template')
      expect(source).toBe('my-template')
    })

    it.concurrent('throws for empty strings', () => {
      expect(() => createTemplateSource('')).toThrow('Invalid template source')
    })

    it.concurrent('throws for whitespace-only strings', () => {
      expect(() => createTemplateSource('   ')).toThrow('Invalid template source')
    })
  })

  describe('isProjectPath', () => {
    it.concurrent('returns true for valid paths', () => {
      expect(isProjectPath('./my-project')).toBe(true)
      expect(isProjectPath('/home/user/project')).toBe(true)
      expect(isProjectPath('project-name')).toBe(true)
    })

    it.concurrent('returns false for paths with null bytes', () => {
      expect(isProjectPath('path\0with\0nulls')).toBe(false)
    })

    it.concurrent('returns false for path traversal attempts', () => {
      expect(isProjectPath('../../../etc/passwd')).toBe(false)
    })

    it.concurrent('returns false for empty strings', () => {
      expect(isProjectPath('')).toBe(false)
      expect(isProjectPath('   ')).toBe(false)
    })

    it.concurrent('returns false for non-strings', () => {
      expect(isProjectPath(123)).toBe(false)
      expect(isProjectPath(null)).toBe(false)
      expect(isProjectPath(undefined)).toBe(false)
    })
  })

  describe('createProjectPath', () => {
    it.concurrent('creates branded project path for valid paths', () => {
      const projectPath = createProjectPath('./my-project')
      expect(projectPath).toBe('./my-project')
    })

    it.concurrent('throws for invalid paths', () => {
      expect(() => createProjectPath('../../../etc')).toThrow('Invalid project path')
    })

    it.concurrent('throws for paths with null bytes', () => {
      expect(() => createProjectPath('path\0null')).toThrow('Invalid project path')
    })
  })

  describe('isPackageName', () => {
    describe('valid package names', () => {
      it.concurrent('accepts lowercase names', () => {
        expect(isPackageName('my-package')).toBe(true)
      })

      it.concurrent('accepts names with numbers', () => {
        expect(isPackageName('package123')).toBe(true)
      })

      it.concurrent('accepts names with dots', () => {
        expect(isPackageName('my.package')).toBe(true)
      })

      it.concurrent('accepts names with underscores', () => {
        expect(isPackageName('my_package')).toBe(true)
      })

      it.concurrent('accepts scoped packages', () => {
        expect(isPackageName('@org/package')).toBe(true)
        expect(isPackageName('@bfra-me/create')).toBe(true)
      })
    })

    describe('invalid package names', () => {
      it.concurrent('rejects empty strings', () => {
        expect(isPackageName('')).toBe(false)
      })

      it.concurrent('rejects names starting with dot', () => {
        expect(isPackageName('.package')).toBe(false)
      })

      it.concurrent('rejects names starting with underscore', () => {
        expect(isPackageName('_package')).toBe(false)
      })

      it.concurrent('rejects names with uppercase', () => {
        expect(isPackageName('MyPackage')).toBe(false)
      })

      it.concurrent('rejects names exceeding 214 characters', () => {
        const longName = 'a'.repeat(215)
        expect(isPackageName(longName)).toBe(false)
      })

      it.concurrent('rejects reserved names', () => {
        expect(isPackageName('node_modules')).toBe(false)
      })

      it.concurrent('rejects Node.js builtin module names', () => {
        expect(isPackageName('fs')).toBe(false)
        expect(isPackageName('path')).toBe(false)
        expect(isPackageName('http')).toBe(false)
      })

      it.concurrent('rejects non-strings', () => {
        expect(isPackageName(123)).toBe(false)
        expect(isPackageName(null)).toBe(false)
      })
    })
  })

  describe('createPackageName', () => {
    it.concurrent('creates branded package name for valid names', () => {
      const name = createPackageName('my-package')
      expect(name).toBe('my-package')
    })

    it.concurrent('creates branded scoped package name', () => {
      const name = createPackageName('@org/my-package')
      expect(name).toBe('@org/my-package')
    })

    it.concurrent('throws for invalid package names', () => {
      expect(() => createPackageName('MyPackage')).toThrow('Invalid package name')
    })

    it.concurrent('throws for reserved names', () => {
      expect(() => createPackageName('node_modules')).toThrow('Invalid package name')
    })
  })

  describe('isTemplateSourceObject', () => {
    it.concurrent('returns true for valid github source', () => {
      const source = {type: 'github', location: 'user/repo'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns true for valid local source', () => {
      const source = {type: 'local', location: './my-template'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns true for valid url source', () => {
      const source = {type: 'url', location: 'https://example.com/template.zip'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns true for valid builtin source', () => {
      const source = {type: 'builtin', location: 'default'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns true with optional ref', () => {
      const source = {type: 'github', location: 'user/repo', ref: 'main'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns true with optional subdir', () => {
      const source = {type: 'github', location: 'user/repo', subdir: 'packages/template'}
      expect(isTemplateSourceObject(source)).toBe(true)
    })

    it.concurrent('returns false for invalid type', () => {
      const source = {type: 'invalid', location: 'something'}
      expect(isTemplateSourceObject(source)).toBe(false)
    })

    it.concurrent('returns false for empty location', () => {
      const source = {type: 'github', location: ''}
      expect(isTemplateSourceObject(source)).toBe(false)
    })

    it.concurrent('returns false for non-object values', () => {
      expect(isTemplateSourceObject(null)).toBe(false)
      expect(isTemplateSourceObject(undefined)).toBe(false)
      expect(isTemplateSourceObject('string')).toBe(false)
      expect(isTemplateSourceObject(123)).toBe(false)
    })

    it.concurrent('returns false for invalid ref type', () => {
      const source = {type: 'github', location: 'user/repo', ref: 123}
      expect(isTemplateSourceObject(source)).toBe(false)
    })

    it.concurrent('returns false for invalid subdir type', () => {
      const source = {type: 'github', location: 'user/repo', subdir: 123}
      expect(isTemplateSourceObject(source)).toBe(false)
    })
  })

  describe('isTemplateVariable', () => {
    it.concurrent('returns true for valid string variable', () => {
      const variable = {name: 'projectName', description: 'Project name', type: 'string'}
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns true for valid boolean variable', () => {
      const variable = {name: 'typescript', description: 'Use TypeScript', type: 'boolean'}
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns true for valid number variable', () => {
      const variable = {name: 'port', description: 'Server port', type: 'number'}
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns true for valid select variable with options', () => {
      const variable = {
        name: 'framework',
        description: 'Framework',
        type: 'select',
        options: ['react', 'vue'],
      }
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns true with optional required flag', () => {
      const variable = {
        name: 'projectName',
        description: 'Project name',
        type: 'string',
        required: true,
      }
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns true with optional pattern', () => {
      const variable = {
        name: 'version',
        description: 'Version',
        type: 'string',
        pattern: String.raw`^\d+\.\d+\.\d+$`,
      }
      expect(isTemplateVariable(variable)).toBe(true)
    })

    it.concurrent('returns false for empty name', () => {
      const variable = {name: '', description: 'Description', type: 'string'}
      expect(isTemplateVariable(variable)).toBe(false)
    })

    it.concurrent('returns false for invalid type', () => {
      const variable = {name: 'test', description: 'Test', type: 'invalid'}
      expect(isTemplateVariable(variable)).toBe(false)
    })

    it.concurrent('returns false for non-boolean required', () => {
      const variable = {name: 'test', description: 'Test', type: 'string', required: 'yes'}
      expect(isTemplateVariable(variable)).toBe(false)
    })

    it.concurrent('returns false for non-string pattern', () => {
      const variable = {name: 'test', description: 'Test', type: 'string', pattern: 123}
      expect(isTemplateVariable(variable)).toBe(false)
    })

    it.concurrent('returns false for non-array options', () => {
      const variable = {name: 'test', description: 'Test', type: 'select', options: 'invalid'}
      expect(isTemplateVariable(variable)).toBe(false)
    })

    it.concurrent('returns false for options with non-string elements', () => {
      const variable = {name: 'test', description: 'Test', type: 'select', options: [1, 2, 3]}
      expect(isTemplateVariable(variable)).toBe(false)
    })
  })

  describe('isTemplateMetadata', () => {
    const validMetadata = {
      name: 'my-template',
      description: 'A test template',
      version: '1.0.0',
    }

    it.concurrent('returns true for minimal valid metadata', () => {
      expect(isTemplateMetadata(validMetadata)).toBe(true)
    })

    it.concurrent('returns true with optional author', () => {
      const metadata = {...validMetadata, author: 'Test Author'}
      expect(isTemplateMetadata(metadata)).toBe(true)
    })

    it.concurrent('returns true with optional tags', () => {
      const metadata = {...validMetadata, tags: ['typescript', 'library']}
      expect(isTemplateMetadata(metadata)).toBe(true)
    })

    it.concurrent('returns true with optional variables', () => {
      const metadata = {
        ...validMetadata,
        variables: [{name: 'projectName', description: 'Name', type: 'string'}],
      }
      expect(isTemplateMetadata(metadata)).toBe(true)
    })

    it.concurrent('returns true with optional dependencies', () => {
      const metadata = {...validMetadata, dependencies: ['typescript', 'vitest']}
      expect(isTemplateMetadata(metadata)).toBe(true)
    })

    it.concurrent('returns true with optional nodeVersion', () => {
      const metadata = {...validMetadata, nodeVersion: '>=18'}
      expect(isTemplateMetadata(metadata)).toBe(true)
    })

    it.concurrent('returns false for missing name', () => {
      const metadata = {description: 'Description', version: '1.0.0'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for empty name', () => {
      const metadata = {name: '', description: 'Description', version: '1.0.0'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for missing description', () => {
      const metadata = {name: 'template', version: '1.0.0'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-string description', () => {
      const metadata = {name: 'template', description: 123, version: '1.0.0'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for missing version', () => {
      const metadata = {name: 'template', description: 'Description'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for empty version', () => {
      const metadata = {name: 'template', description: 'Description', version: ''}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-string author', () => {
      const metadata = {...validMetadata, author: 123}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-array tags', () => {
      const metadata = {...validMetadata, tags: 'invalid'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for tags with non-string elements', () => {
      const metadata = {...validMetadata, tags: [1, 2, 3]}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for invalid variables', () => {
      const metadata = {
        ...validMetadata,
        variables: [{name: '', description: 'Invalid', type: 'string'}],
      }
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-array dependencies', () => {
      const metadata = {...validMetadata, dependencies: 'invalid'}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-string nodeVersion', () => {
      const metadata = {...validMetadata, nodeVersion: 18}
      expect(isTemplateMetadata(metadata)).toBe(false)
    })

    it.concurrent('returns false for non-object values', () => {
      expect(isTemplateMetadata(null)).toBe(false)
      expect(isTemplateMetadata(undefined)).toBe(false)
      expect(isTemplateMetadata('string')).toBe(false)
    })
  })

  describe('isPackageManager', () => {
    it.concurrent('returns true for npm', () => {
      expect(isPackageManager('npm')).toBe(true)
    })

    it.concurrent('returns true for yarn', () => {
      expect(isPackageManager('yarn')).toBe(true)
    })

    it.concurrent('returns true for pnpm', () => {
      expect(isPackageManager('pnpm')).toBe(true)
    })

    it.concurrent('returns true for bun', () => {
      expect(isPackageManager('bun')).toBe(true)
    })

    it.concurrent('returns false for unknown package managers', () => {
      expect(isPackageManager('pip')).toBe(false)
      expect(isPackageManager('cargo')).toBe(false)
    })

    it.concurrent('returns false for non-strings', () => {
      expect(isPackageManager(123)).toBe(false)
      expect(isPackageManager(null)).toBe(false)
    })
  })

  describe('isProjectType', () => {
    it.concurrent('returns true for typescript', () => {
      expect(isProjectType('typescript')).toBe(true)
    })

    it.concurrent('returns true for javascript', () => {
      expect(isProjectType('javascript')).toBe(true)
    })

    it.concurrent('returns true for react', () => {
      expect(isProjectType('react')).toBe(true)
    })

    it.concurrent('returns true for vue', () => {
      expect(isProjectType('vue')).toBe(true)
    })

    it.concurrent('returns true for angular', () => {
      expect(isProjectType('angular')).toBe(true)
    })

    it.concurrent('returns true for node', () => {
      expect(isProjectType('node')).toBe(true)
    })

    it.concurrent('returns true for unknown', () => {
      expect(isProjectType('unknown')).toBe(true)
    })

    it.concurrent('returns false for invalid types', () => {
      expect(isProjectType('svelte')).toBe(false)
      expect(isProjectType('ruby')).toBe(false)
    })

    it.concurrent('returns false for non-strings', () => {
      expect(isProjectType(123)).toBe(false)
      expect(isProjectType(null)).toBe(false)
    })
  })
})
