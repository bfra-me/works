/**
 * Configuration parser tests for verifying package.json and tsconfig.json parsing.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {
  getAllDependencies,
  parsePackageJson,
  parsePackageJsonContent,
  parseTsConfig,
  parseTsConfigContent,
  resolveTsConfigExtends,
} from '../../src/parser/config-parser'

async function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'config-parser-test-'))
}

async function cleanupTempDir(dir: string): Promise<void> {
  await fs.rm(dir, {recursive: true, force: true})
}

describe('config-parser', () => {
  describe('parsePackageJson', () => {
    it('should parse a valid package.json file', async () => {
      const tempDir = await createTempDir()
      try {
        const pkgPath = path.join(tempDir, 'package.json')
        await fs.writeFile(
          pkgPath,
          JSON.stringify({
            name: '@test/pkg',
            version: '1.0.0',
            description: 'Test package',
            dependencies: {lodash: '^4.17.0'},
            devDependencies: {typescript: '^5.0.0'},
          }),
        )

        const result = await parsePackageJson(pkgPath)

        expect(result.success).toBe(true)
        expect(result.success && result.data.name).toBe('@test/pkg')
        expect(result.success && result.data.version).toBe('1.0.0')
        expect(result.success && result.data.description).toBe('Test package')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should accept directory path and find package.json', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(
          path.join(tempDir, 'package.json'),
          JSON.stringify({name: 'from-dir', version: '2.0.0'}),
        )

        const result = await parsePackageJson(tempDir)

        expect(result.success).toBe(true)
        expect(result.success && result.data.name).toBe('from-dir')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should return error for missing package.json', async () => {
      const tempDir = await createTempDir()
      try {
        const result = await parsePackageJson(path.join(tempDir, 'nonexistent'))

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('FILE_NOT_FOUND')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should return error for invalid JSON', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(path.join(tempDir, 'package.json'), 'invalid json content')

        const result = await parsePackageJson(tempDir)

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('INVALID_JSON')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should return error for missing required fields', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(
          path.join(tempDir, 'package.json'),
          JSON.stringify({description: 'no name or version'}),
        )

        const result = await parsePackageJson(tempDir)

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('INVALID_CONFIG')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })

  describe('parsePackageJsonContent', () => {
    it.concurrent('should parse package.json from string content', () => {
      const content = JSON.stringify({
        name: 'test-pkg',
        version: '1.0.0',
        type: 'module',
        main: './lib/index.js',
        exports: {'.': './lib/index.js'},
      })

      const result = parsePackageJsonContent(content, '/path/to/package.json')

      expect(result.success).toBe(true)
      expect(result.success && result.data.type).toBe('module')
      expect(result.success && result.data.main).toBe('./lib/index.js')
      expect(result.success && result.data.exports).toBeDefined()
    })

    it.concurrent('should preserve raw package.json data', () => {
      const content = JSON.stringify({
        name: 'test',
        version: '1.0.0',
        customField: {nested: 'value'},
      })

      const result = parsePackageJsonContent(content, '/path/to/package.json')

      expect(result.success).toBe(true)
      expect(
        result.success && (result.data.raw as Record<string, unknown>).customField,
      ).toBeDefined()
    })
  })

  describe('parseTsConfig', () => {
    it('should parse a valid tsconfig.json file', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(
          path.join(tempDir, 'tsconfig.json'),
          JSON.stringify({
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              strict: true,
            },
            include: ['src/**/*'],
            exclude: ['node_modules'],
          }),
        )

        const result = await parseTsConfig(tempDir)

        expect(result.success).toBe(true)
        expect(result.success && result.data.compilerOptions?.target).toBe('ES2022')
        expect(result.success && result.data.compilerOptions?.module).toBe('NodeNext')
        expect(result.success && result.data.compilerOptions?.strict).toBe(true)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should return error for missing tsconfig.json', async () => {
      const tempDir = await createTempDir()
      try {
        const result = await parseTsConfig(path.join(tempDir, 'nonexistent'))

        expect(result.success).toBe(false)
        expect(!result.success && result.error.code).toBe('FILE_NOT_FOUND')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should handle extends field', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(
          path.join(tempDir, 'tsconfig.json'),
          JSON.stringify({
            extends: '@bfra.me/tsconfig',
            compilerOptions: {outDir: './lib'},
          }),
        )

        const result = await parseTsConfig(tempDir)

        expect(result.success).toBe(true)
        expect(result.success && result.data.extends).toBe('@bfra.me/tsconfig')
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should parse project references', async () => {
      const tempDir = await createTempDir()
      try {
        await fs.writeFile(
          path.join(tempDir, 'tsconfig.json'),
          JSON.stringify({
            compilerOptions: {},
            references: [{path: '../other-pkg'}, {path: '../another-pkg'}],
          }),
        )

        const result = await parseTsConfig(tempDir)

        expect(result.success).toBe(true)
        expect(result.success && result.data.references).toHaveLength(2)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })

  describe('parseTsConfigContent', () => {
    it.concurrent('should parse tsconfig from string content', () => {
      const content = JSON.stringify({
        compilerOptions: {
          paths: {'@/*': ['./src/*']},
          baseUrl: '.',
        },
      })

      const result = parseTsConfigContent(content, '/path/to/tsconfig.json')

      expect(result.success).toBe(true)
      expect(result.success && result.data.compilerOptions?.paths).toBeDefined()
      expect(result.success && result.data.compilerOptions?.baseUrl).toBe('.')
    })

    it.concurrent('should handle tsconfig with comments', () => {
      const content = `{
        // This is a comment
        "compilerOptions": {
          "target": "ES2022" // inline comment
        }
        /* multi-line
           comment */
      }`

      const result = parseTsConfigContent(content, '/path/to/tsconfig.json')

      expect(result.success).toBe(true)
      expect(result.success && result.data.compilerOptions?.target).toBe('ES2022')
    })

    it.concurrent('should handle trailing commas', () => {
      const content = `{
        "compilerOptions": {
          "strict": true,
        },
      }`

      const result = parseTsConfigContent(content, '/path/to/tsconfig.json')

      expect(result.success).toBe(true)
      expect(result.success && result.data.compilerOptions?.strict).toBe(true)
    })
  })

  describe('getAllDependencies', () => {
    it.concurrent('should combine all dependency types', () => {
      const pkg = {
        name: 'test',
        version: '1.0.0',
        dependencies: {lodash: '^4.17.0'},
        devDependencies: {typescript: '^5.0.0'},
        peerDependencies: {react: '>=18'},
        optionalDependencies: {'@parcel/watcher': '^2.0.0'},
        raw: {},
      }

      const deps = getAllDependencies(pkg)

      expect(deps.lodash).toEqual({version: '^4.17.0', type: 'prod'})
      expect(deps.typescript).toEqual({version: '^5.0.0', type: 'dev'})
      expect(deps.react).toEqual({version: '>=18', type: 'peer'})
      expect(deps['@parcel/watcher']).toEqual({version: '^2.0.0', type: 'optional'})
    })

    it.concurrent('should handle missing dependency types', () => {
      const pkg = {
        name: 'minimal',
        version: '1.0.0',
        raw: {},
      }

      const deps = getAllDependencies(pkg)

      expect(Object.keys(deps)).toHaveLength(0)
    })
  })

  describe('resolveTsConfigExtends', () => {
    it('should resolve a simple extends chain', async () => {
      const tempDir = await createTempDir()
      try {
        const baseConfig = path.join(tempDir, 'base.json')
        const childConfig = path.join(tempDir, 'child.json')

        await fs.writeFile(baseConfig, JSON.stringify({compilerOptions: {strict: true}}))
        await fs.writeFile(
          childConfig,
          JSON.stringify({extends: './base.json', compilerOptions: {outDir: 'lib'}}),
        )

        const result = await resolveTsConfigExtends(childConfig)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(2)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should handle configs without extends', async () => {
      const tempDir = await createTempDir()
      try {
        const configPath = path.join(tempDir, 'standalone.json')
        await fs.writeFile(configPath, JSON.stringify({compilerOptions: {target: 'ES2022'}}))

        const result = await resolveTsConfigExtends(configPath)

        expect(result.success).toBe(true)
        expect(result.success && result.data).toHaveLength(1)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })

    it('should respect maxDepth parameter', async () => {
      const tempDir = await createTempDir()
      try {
        const config1 = path.join(tempDir, 'c1.json')
        const config2 = path.join(tempDir, 'c2.json')
        const config3 = path.join(tempDir, 'c3.json')

        await fs.writeFile(config3, JSON.stringify({compilerOptions: {}}))
        await fs.writeFile(config2, JSON.stringify({extends: './c3.json'}))
        await fs.writeFile(config1, JSON.stringify({extends: './c2.json'}))

        const result = await resolveTsConfigExtends(config1, 1)

        expect(result.success).toBe(true)
        expect(result.success && result.data.length).toBeLessThanOrEqual(2)
      } finally {
        await cleanupTempDir(tempDir)
      }
    })
  })
})
