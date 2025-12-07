/**
 * Tests for template processing pipeline factory
 * Part of Phase 5: Comprehensive Testing Implementation (TASK-034)
 */

import type {
  PipelineConfig,
  PipelineDependencies,
  PipelineExecutionOptions,
} from '../../src/templates/pipeline.js'
import type {
  FileOperation,
  TemplateContext,
  TemplateMetadata,
  TemplateSource,
  ValidationResult,
} from '../../src/types.js'
import {err, isErr, isOk, ok} from '@bfra.me/es/result'
import {describe, expect, it, vi} from 'vitest'
import {
  createFetchStage,
  createProcessStage,
  createResolveStage,
  createTemplateProcessingPipeline,
  createValidateStage,
  DEFAULT_PIPELINE_CONFIG,
  PipelineStageNames,
} from '../../src/templates/pipeline.js'

// Mock the logger to prevent console output during tests
vi.mock('../../src/utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock fs/promises and os for temp directory creation
vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn().mockResolvedValue('/tmp/bfra-create-test123'),
}))

vi.mock('node:os', () => ({
  tmpdir: vi.fn().mockReturnValue('/tmp'),
}))

vi.mock('node:path', () => ({
  default: {
    join: (...parts: string[]) => parts.join('/'),
  },
  join: (...parts: string[]) => parts.join('/'),
}))

/**
 * Creates mock dependencies for pipeline testing
 */
function createMockDependencies(
  overrides: Partial<PipelineDependencies> = {},
): PipelineDependencies {
  const mockMetadata: TemplateMetadata = {
    name: 'test-template',
    description: 'A test template',
    version: '1.0.0',
    author: 'Test Author',
    tags: ['test'],
    variables: [],
  }

  const mockSource: TemplateSource = {
    type: 'github',
    location: 'test/repo',
    ref: 'main',
  }

  return {
    resolve: vi.fn().mockReturnValue(mockSource),
    fetch: vi.fn().mockResolvedValue(ok({path: '/tmp/template', metadata: mockMetadata})),
    validate: vi.fn().mockResolvedValue(ok(undefined)),
    process: vi.fn().mockResolvedValue(
      ok({
        operations: [
          {type: 'create', target: 'package.json', content: '{}'},
          {type: 'create', target: 'README.md', content: '# Test'},
        ] as FileOperation[],
      }),
    ),
    ...overrides,
  }
}

/**
 * Creates mock execution options
 */
function createMockOptions(
  overrides: Partial<PipelineExecutionOptions> = {},
): PipelineExecutionOptions {
  return {
    outputDir: '/output/test-project',
    context: {
      projectName: 'test-project',
      description: 'A test project',
      author: 'Test Author',
      version: '1.0.0',
    },
    ...overrides,
  }
}

describe('template processing pipeline', () => {
  describe('PipelineStageNames', () => {
    it.concurrent('exports all stage names', () => {
      expect(PipelineStageNames.RESOLVE).toBe('resolve')
      expect(PipelineStageNames.FETCH).toBe('fetch')
      expect(PipelineStageNames.VALIDATE).toBe('validate')
      expect(PipelineStageNames.PARSE).toBe('parse')
      expect(PipelineStageNames.RENDER).toBe('render')
    })
  })

  describe('DEFAULT_PIPELINE_CONFIG', () => {
    it.concurrent('has correct default values', () => {
      expect(DEFAULT_PIPELINE_CONFIG.cacheEnabled).toBe(true)
      expect(DEFAULT_PIPELINE_CONFIG.cacheTTL).toBe(3600)
      expect(DEFAULT_PIPELINE_CONFIG.verbose).toBe(false)
      expect(DEFAULT_PIPELINE_CONFIG.dryRun).toBe(false)
      expect(DEFAULT_PIPELINE_CONFIG.templateExtensions).toEqual(['.eta', '.template'])
      expect(DEFAULT_PIPELINE_CONFIG.variableDelimiters).toEqual({start: '<%', end: '%>'})
    })

    it.concurrent('has default ignore patterns', () => {
      expect(DEFAULT_PIPELINE_CONFIG.ignorePatterns).toContain('**/node_modules/**')
      expect(DEFAULT_PIPELINE_CONFIG.ignorePatterns).toContain('**/.git/**')
      expect(DEFAULT_PIPELINE_CONFIG.ignorePatterns).toContain('**/dist/**')
    })
  })

  describe('createTemplateProcessingPipeline', () => {
    describe('pipeline creation', () => {
      it.concurrent('creates a pipeline with default config', () => {
        const dependencies = createMockDependencies()
        const pipeline = createTemplateProcessingPipeline(dependencies)

        expect(pipeline).toHaveProperty('execute')
        expect(pipeline).toHaveProperty('getConfig')
        expect(pipeline).toHaveProperty('updateConfig')
      })

      it.concurrent('creates a pipeline with custom config', () => {
        const dependencies = createMockDependencies()
        const customConfig: PipelineConfig = {
          cacheEnabled: false,
          verbose: true,
          dryRun: true,
        }
        const pipeline = createTemplateProcessingPipeline(dependencies, customConfig)
        const config = pipeline.getConfig()

        expect(config.cacheEnabled).toBe(false)
        expect(config.verbose).toBe(true)
        expect(config.dryRun).toBe(true)
      })

      it.concurrent('merges custom config with defaults', () => {
        const dependencies = createMockDependencies()
        const pipeline = createTemplateProcessingPipeline(dependencies, {verbose: true})
        const config = pipeline.getConfig()

        expect(config.verbose).toBe(true)
        expect(config.cacheEnabled).toBe(DEFAULT_PIPELINE_CONFIG.cacheEnabled)
        expect(config.cacheTTL).toBe(DEFAULT_PIPELINE_CONFIG.cacheTTL)
      })
    })

    describe('getConfig', () => {
      it.concurrent('returns a copy of current config', () => {
        const dependencies = createMockDependencies()
        const pipeline = createTemplateProcessingPipeline(dependencies)
        const config1 = pipeline.getConfig()
        const config2 = pipeline.getConfig()

        expect(config1).toEqual(config2)
        expect(config1).not.toBe(config2)
      })
    })

    describe('updateConfig', () => {
      it('updates specific config values', () => {
        const dependencies = createMockDependencies()
        const pipeline = createTemplateProcessingPipeline(dependencies)

        pipeline.updateConfig({verbose: true})
        expect(pipeline.getConfig().verbose).toBe(true)

        pipeline.updateConfig({dryRun: true})
        expect(pipeline.getConfig().dryRun).toBe(true)
        expect(pipeline.getConfig().verbose).toBe(true)
      })

      it('preserves unmodified config values', () => {
        const dependencies = createMockDependencies()
        const pipeline = createTemplateProcessingPipeline(dependencies, {
          cacheEnabled: false,
          cacheTTL: 7200,
        })

        pipeline.updateConfig({verbose: true})
        const config = pipeline.getConfig()

        expect(config.verbose).toBe(true)
        expect(config.cacheEnabled).toBe(false)
        expect(config.cacheTTL).toBe(7200)
      })
    })

    describe('execute', () => {
      describe('successful execution', () => {
        it('executes all pipeline stages in order', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isOk(result)).toBe(true)
          expect(dependencies.resolve).toHaveBeenCalledWith('user/repo')
          expect(dependencies.fetch).toHaveBeenCalled()
          expect(dependencies.validate).toHaveBeenCalled()
          expect(dependencies.process).toHaveBeenCalled()
        })

        it('returns pipeline result with correct structure', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isOk(result)).toBe(true)
          expect(isOk(result) && result.data).toHaveProperty('template')
          expect(isOk(result) && result.data).toHaveProperty('operations')
          expect(isOk(result) && result.data).toHaveProperty('stats')
          expect(isOk(result) && result.data.operations).toHaveLength(2)
        })

        it('returns pipeline stats with timing information', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isOk(result)).toBe(true)
          const stats = isOk(result) ? result.data.stats : null
          expect(stats?.totalTimeMs).toBeGreaterThanOrEqual(0)
          expect(stats?.stageTimings).toHaveProperty('resolve')
          expect(stats?.stageTimings).toHaveProperty('fetch')
          expect(stats?.stageTimings).toHaveProperty('validate')
          expect(stats?.stageTimings).toHaveProperty('render')
          expect(stats?.filesProcessed).toBe(2)
          expect(stats?.cacheHit).toBe(false)
        })

        it('calls progress callback for each stage', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const progressCallback = vi.fn()
          const options = createMockOptions({onProgress: progressCallback})

          await pipeline.execute('user/repo', options)

          expect(progressCallback).toHaveBeenCalled()
          const stages = progressCallback.mock.calls.map((call: unknown[]) => call[0] as string)
          expect(stages).toContain('resolve')
          expect(stages).toContain('fetch')
          expect(stages).toContain('validate')
          expect(stages).toContain('render')
        })
      })

      describe('template validation', () => {
        it('rejects invalid template identifiers', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('', options)

          expect(isErr(result)).toBe(true)
          expect(isErr(result) && result.error.message).toContain('Invalid template identifier')
        })

        it('rejects path traversal attempts', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('../../../etc/passwd', options)

          expect(isErr(result)).toBe(true)
        })
      })

      describe('stage failure handling', () => {
        it('returns error when resolve stage fails', async () => {
          const dependencies = createMockDependencies({
            resolve: vi.fn().mockImplementation(() => {
              throw new Error('Failed to resolve template')
            }),
          })
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isErr(result)).toBe(true)
          expect(isErr(result) && result.error.message).toContain('resolve')
        })

        it('returns error when fetch stage fails', async () => {
          const dependencies = createMockDependencies({
            fetch: vi.fn().mockResolvedValue(err(new Error('Failed to fetch template'))),
          })
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isErr(result)).toBe(true)
        })

        it('returns error when validate stage fails', async () => {
          const dependencies = createMockDependencies({
            validate: vi.fn().mockResolvedValue(err(new Error('Validation failed'))),
          })
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isErr(result)).toBe(true)
        })

        it('returns error when process stage fails', async () => {
          const dependencies = createMockDependencies({
            process: vi.fn().mockResolvedValue(err(new Error('Processing failed'))),
          })
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isErr(result)).toBe(true)
        })

        it('stops execution after first stage failure', async () => {
          const dependencies = createMockDependencies({
            fetch: vi.fn().mockResolvedValue(err(new Error('Failed to fetch'))),
          })
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const options = createMockOptions()

          await pipeline.execute('user/repo', options)

          expect(dependencies.resolve).toHaveBeenCalled()
          expect(dependencies.fetch).toHaveBeenCalled()
          expect(dependencies.validate).not.toHaveBeenCalled()
          expect(dependencies.process).not.toHaveBeenCalled()
        })
      })

      describe('dry run mode', () => {
        it('skips file writes in dry run mode', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies, {dryRun: true})
          const options = createMockOptions()

          const result = await pipeline.execute('user/repo', options)

          expect(isOk(result)).toBe(true)
          expect(isOk(result) && result.data.operations).toHaveLength(0)
        })

        it('still validates template in dry run mode', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies, {dryRun: true})
          const options = createMockOptions()

          await pipeline.execute('user/repo', options)

          expect(dependencies.validate).toHaveBeenCalled()
        })
      })

      describe('context handling', () => {
        it('passes context to process stage', async () => {
          const dependencies = createMockDependencies()
          const pipeline = createTemplateProcessingPipeline(dependencies)
          const context: TemplateContext = {
            projectName: 'my-custom-project',
            description: 'Custom description',
            author: 'Custom Author',
            version: '2.0.0',
            packageManager: 'pnpm',
          }
          const options = createMockOptions({context})

          await pipeline.execute('user/repo', options)

          expect(dependencies.process).toHaveBeenCalledWith(
            expect.any(String),
            options.outputDir,
            context,
          )
        })
      })
    })
  })

  describe('createResolveStage', () => {
    it.concurrent('returns ok result for successful resolution', () => {
      const mockSource: TemplateSource = {
        type: 'github',
        location: 'user/repo',
      }
      const resolver = vi.fn().mockReturnValue(mockSource)
      const resolveStage = createResolveStage(resolver)

      const result = resolveStage('user/repo')

      expect(isOk(result)).toBe(true)
      expect(isOk(result) && result.data).toEqual(mockSource)
    })

    it.concurrent('returns err result when resolver throws', () => {
      const resolver = vi.fn().mockImplementation(() => {
        throw new Error('Resolution failed')
      })
      const resolveStage = createResolveStage(resolver)

      const result = resolveStage('invalid/template')

      expect(isErr(result)).toBe(true)
      expect(isErr(result) && result.error.message).toContain('Failed to resolve template')
    })

    it.concurrent('passes template to resolver', () => {
      const resolver = vi.fn().mockReturnValue({type: 'github', location: 'test'})
      const resolveStage = createResolveStage(resolver)

      resolveStage('my-template')

      expect(resolver).toHaveBeenCalledWith('my-template')
    })
  })

  describe('createFetchStage', () => {
    it('calls fetcher with source and target directory', async () => {
      const mockResult = ok({path: '/tmp/template', metadata: {} as TemplateMetadata})
      const fetcher = vi.fn().mockResolvedValue(mockResult)
      const fetchStage = createFetchStage(fetcher)
      const source: TemplateSource = {type: 'github', location: 'user/repo'}

      const result = await fetchStage(source, '/tmp/target')

      expect(fetcher).toHaveBeenCalledWith(source, '/tmp/target')
      expect(isOk(result)).toBe(true)
    })

    it('returns error when fetcher fails', async () => {
      const fetcher = vi.fn().mockResolvedValue(err(new Error('Fetch failed')))
      const fetchStage = createFetchStage(fetcher)
      const source: TemplateSource = {type: 'github', location: 'user/repo'}

      const result = await fetchStage(source, '/tmp/target')

      expect(isErr(result)).toBe(true)
    })

    it('passes through result when cache is disabled', async () => {
      const mockResult = ok({path: '/tmp/template', metadata: {} as TemplateMetadata})
      const fetcher = vi.fn().mockResolvedValue(mockResult)
      const fetchStage = createFetchStage(fetcher, {cacheEnabled: false})
      const source: TemplateSource = {type: 'github', location: 'user/repo'}

      const result = await fetchStage(source, '/tmp/target')

      expect(isOk(result)).toBe(true)
      expect(fetcher).toHaveBeenCalled()
    })
  })

  describe('createValidateStage', () => {
    it('returns ok result for valid template', async () => {
      const validator = vi.fn().mockResolvedValue({valid: true} as ValidationResult)
      const validateStage = createValidateStage(validator)

      const result = await validateStage('/tmp/template')

      expect(isOk(result)).toBe(true)
      expect(validator).toHaveBeenCalledWith('/tmp/template')
    })

    it('returns err result for invalid template', async () => {
      const validator = vi.fn().mockResolvedValue({
        valid: false,
        errors: ['Missing template.json', 'Invalid metadata format'],
      } as ValidationResult)
      const validateStage = createValidateStage(validator)

      const result = await validateStage('/tmp/template')

      expect(isErr(result)).toBe(true)
      const errorMessage = isErr(result) ? result.error.message : ''
      expect(errorMessage).toContain('validation failed')
      expect(errorMessage).toContain('Missing template.json')
    })

    it('handles warnings without failing', async () => {
      const validator = vi.fn().mockResolvedValue({
        valid: true,
        warnings: ['Deprecated field in template.json'],
      } as ValidationResult)
      const validateStage = createValidateStage(validator)

      const result = await validateStage('/tmp/template')

      expect(isOk(result)).toBe(true)
    })

    it('handles empty error array', async () => {
      const validator = vi.fn().mockResolvedValue({
        valid: false,
        errors: [],
      } as ValidationResult)
      const validateStage = createValidateStage(validator)

      const result = await validateStage('/tmp/template')

      expect(isErr(result)).toBe(true)
      const errorMessage = isErr(result) ? result.error.message : ''
      // Empty errors array results in empty string after join
      expect(errorMessage).toContain('validation failed')
    })
  })

  describe('createProcessStage', () => {
    it('passes through to processor function', async () => {
      const mockResult = ok({operations: [] as FileOperation[]})
      const processor = vi.fn().mockResolvedValue(mockResult)
      const processStage = createProcessStage(processor)
      const context: TemplateContext = {projectName: 'test'}

      const result = await processStage('/tmp/template', '/output', context)

      expect(processor).toHaveBeenCalledWith('/tmp/template', '/output', context)
      expect(isOk(result)).toBe(true)
    })

    it('returns processor result unchanged', async () => {
      const operations: FileOperation[] = [
        {type: 'create', target: 'index.ts', content: 'export {}'},
      ]
      const processor = vi.fn().mockResolvedValue(ok({operations}))
      const processStage = createProcessStage(processor)
      const context: TemplateContext = {projectName: 'test'}

      const result = await processStage('/tmp/template', '/output', context)

      expect(isOk(result)).toBe(true)
      const resultOps = isOk(result) ? result.data.operations : null
      expect(resultOps).toEqual(operations)
    })

    it('accepts config parameter for future use', async () => {
      const processor = vi.fn().mockResolvedValue(ok({operations: []}))
      const processStage = createProcessStage(processor, {
        templateExtensions: ['.eta'],
        ignorePatterns: ['**/*.test.ts'],
        variableDelimiters: {start: '{{', end: '}}'},
      })
      const context: TemplateContext = {projectName: 'test'}

      const result = await processStage('/tmp/template', '/output', context)

      expect(isOk(result)).toBe(true)
    })
  })

  describe('pipeline integration', () => {
    it('handles complete workflow with all stages', async () => {
      const mockMetadata: TemplateMetadata = {
        name: 'integration-template',
        description: 'Integration test template',
        version: '1.0.0',
      }

      const mockOperations: FileOperation[] = [
        {type: 'create', target: 'package.json', content: '{"name": "test"}'},
        {type: 'create', target: 'src/index.ts', content: 'export {}'},
        {type: 'copy', source: 'README.md', target: 'README.md'},
      ]

      const dependencies = createMockDependencies({
        resolve: vi.fn().mockReturnValue({type: 'github', location: 'integration/test'}),
        fetch: vi.fn().mockResolvedValue(ok({path: '/tmp/integration', metadata: mockMetadata})),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
        process: vi.fn().mockResolvedValue(ok({operations: mockOperations})),
      })

      const pipeline = createTemplateProcessingPipeline(dependencies, {verbose: true})
      const options = createMockOptions({
        outputDir: '/projects/integration-test',
        context: {
          projectName: 'integration-test',
          description: 'Integration test project',
          packageManager: 'pnpm',
        },
      })

      const result = await pipeline.execute('integration/test', options)

      expect(isOk(result)).toBe(true)
      const data = isOk(result) ? result.data : null
      expect(data?.template.metadata.name).toBe('integration-template')
      expect(data?.operations).toHaveLength(3)
      expect(data?.stats.filesProcessed).toBe(3)
    })

    it('propagates context through entire pipeline', async () => {
      let capturedContext: TemplateContext | undefined

      const dependencies = createMockDependencies({
        process: vi
          .fn()
          .mockImplementation(
            async (_template: string, _output: string, context: TemplateContext) => {
              capturedContext = context
              return ok({operations: []})
            },
          ),
      })

      const pipeline = createTemplateProcessingPipeline(dependencies)
      const expectedContext: TemplateContext = {
        projectName: 'context-test',
        description: 'Testing context propagation',
        author: 'Test',
        version: '1.0.0',
        packageManager: 'yarn',
        variables: {customVar: 'customValue'},
      }
      const options = createMockOptions({context: expectedContext})

      await pipeline.execute('user/repo', options)

      expect(capturedContext).toEqual(expectedContext)
    })
  })
})
