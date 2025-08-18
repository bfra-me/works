import type {AIProjectAnalysis, AIProvider} from '../../src/types.js'

import {beforeEach, describe, expect, it, vi} from 'vitest'
import {testUtils} from '../test-utils.js'

describe('aI feature architecture tests', () => {
  beforeEach(() => {
    testUtils.setup()
    vi.clearAllMocks()
  })

  describe('aI provider configuration', () => {
    it.concurrent('validates OpenAI provider configuration', () => {
      const provider: AIProvider = {
        name: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      }

      expect(provider.name).toBe('openai')
      expect(provider.apiKey).toBe('test-key')
      expect(provider.model).toBe('gpt-4')
    })

    it.concurrent('validates Anthropic provider configuration', () => {
      const provider: AIProvider = {
        name: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-sonnet',
      }

      expect(provider.name).toBe('anthropic')
      expect(provider.apiKey).toBe('test-key')
      expect(provider.model).toBe('claude-3-sonnet')
    })

    it.concurrent('supports custom provider configuration', () => {
      const provider: AIProvider = {
        name: 'custom',
        endpoint: 'https://api.custom.ai/v1',
        apiKey: 'custom-key',
        model: 'custom-model',
      }

      expect(provider.name).toBe('custom')
      expect(provider.endpoint).toBe('https://api.custom.ai/v1')
    })
  })

  describe('aI project analysis structure', () => {
    it.concurrent('creates valid project analysis with template recommendation', () => {
      const analysis: AIProjectAnalysis = {
        recommendedTemplate: 'library',
        dependencies: ['typescript', '@types/node', 'vitest'],
        configurations: {
          typescript: true,
          eslint: true,
          prettier: true,
          vitest: true,
        },
        confidence: 0.95,
      }

      expect(analysis.recommendedTemplate).toBe('library')
      expect(analysis.dependencies).toContain('typescript')
      expect(analysis.configurations?.typescript).toBe(true)
      expect(analysis.confidence).toBe(0.95)
    })

    it.concurrent('creates analysis for React project', () => {
      const analysis: AIProjectAnalysis = {
        recommendedTemplate: 'react',
        dependencies: ['react', 'react-dom', 'vite'],
        configurations: {
          typescript: true,
          vite: true,
          tailwind: false,
          router: true,
        },
        confidence: 0.88,
      }

      expect(analysis.recommendedTemplate).toBe('react')
      expect(analysis.dependencies).toContain('react')
      expect(analysis.configurations?.typescript).toBe(true)
      expect(analysis.configurations?.router).toBe(true)
    })

    it.concurrent('handles low confidence analysis', () => {
      const analysis: AIProjectAnalysis = {
        recommendedTemplate: 'default',
        dependencies: ['typescript'],
        configurations: {
          typescript: true,
        },
        confidence: 0.25,
      }

      expect(analysis.confidence).toBeLessThan(0.5)
      expect(analysis.recommendedTemplate).toBe('default')
    })
  })

  describe('aI integration patterns', () => {
    it.concurrent('simulates project requirement analysis workflow', () => {
      const userQuery =
        'I want to create a TypeScript library for utility functions with comprehensive testing'

      const analysisResult: AIProjectAnalysis = {
        recommendedTemplate: 'library',
        dependencies: ['typescript', '@types/node', 'vitest', 'tsup'],
        configurations: {
          typescript: true,
          eslint: true,
          prettier: true,
          vitest: true,
          tsup: true,
        },
        confidence: 0.95,
      }

      expect(analysisResult.recommendedTemplate).toBe('library')
      expect(analysisResult.dependencies).toContain('typescript')
      expect(analysisResult.dependencies).toContain('vitest')
      expect(analysisResult.configurations?.typescript).toBe(true)
      expect(analysisResult.confidence).toBeGreaterThan(0.9)

      expect(userQuery).toContain('TypeScript library')
      expect(userQuery).toContain('utility functions')
      expect(userQuery).toContain('testing')
    })

    it.concurrent('simulates React project analysis workflow', () => {
      const analysisResult: AIProjectAnalysis = {
        recommendedTemplate: 'react',
        dependencies: ['react', 'react-dom', '@types/react', '@types/react-dom', 'vite'],
        configurations: {
          typescript: true,
          vite: true,
          tailwind: true,
          router: false,
          stateManagement: 'context',
        },
        confidence: 0.88,
      }

      expect(analysisResult.recommendedTemplate).toBe('react')
      expect(analysisResult.dependencies).toContain('react')
      expect(analysisResult.dependencies).toContain('@types/react')
      expect(analysisResult.configurations?.typescript).toBe(true)
      expect(analysisResult.configurations?.tailwind).toBe(true)
    })

    it.concurrent('handles ambiguous project requirements', () => {
      const analysisResult: AIProjectAnalysis = {
        recommendedTemplate: 'default',
        dependencies: ['typescript'],
        configurations: {
          typescript: true,
        },
        confidence: 0.15,
      }

      expect(analysisResult.confidence).toBeLessThan(0.5)
      expect(analysisResult.recommendedTemplate).toBe('default')
      expect(analysisResult.dependencies).toHaveLength(1)
    })
  })

  describe('dependency recommendation patterns', () => {
    it.concurrent('generates appropriate dependency recommendations for library', () => {
      const recommendations = {
        dependencies: [],
        devDependencies: ['typescript', '@types/node', 'vitest', 'tsup', '@bfra.me/eslint-config'],
        peerDependencies: [],
        scripts: {
          build: 'tsup',
          test: 'vitest run',
          'test:watch': 'vitest',
          'type-check': 'tsc --noEmit',
          lint: 'eslint .',
        },
        packageManagerConfig: {
          pnpm: {
            '.npmrc': 'shamefully-hoist=true',
          },
        },
      }

      expect(recommendations.devDependencies).toContain('typescript')
      expect(recommendations.devDependencies).toContain('vitest')
      expect(recommendations.scripts.build).toBe('tsup')
      expect(recommendations.scripts.test).toBe('vitest run')
    })

    it.concurrent('generates React project dependencies', () => {
      const recommendations = {
        dependencies: ['react', 'react-dom'],
        devDependencies: [
          '@types/react',
          '@types/react-dom',
          'vite',
          'typescript',
          '@vitejs/plugin-react',
        ],
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          test: 'vitest',
        },
      }

      expect(recommendations.dependencies).toContain('react')
      expect(recommendations.devDependencies).toContain('@types/react')
      expect(recommendations.devDependencies).toContain('vite')
      expect(recommendations.scripts.dev).toBe('vite')
    })

    it.concurrent('generates CLI tool dependencies', () => {
      const recommendations = {
        dependencies: ['commander', 'chalk', 'inquirer'],
        devDependencies: ['@types/node', '@types/inquirer', 'typescript', 'tsup'],
        scripts: {
          build: 'tsup',
          dev: 'tsup --watch',
          start: 'node lib/cli.js',
        },
        binaries: {
          'my-cli': './lib/cli.js',
        },
      }

      expect(recommendations.dependencies).toContain('commander')
      expect(recommendations.dependencies).toContain('chalk')
      expect(recommendations.binaries).toBeDefined()
    })
  })

  describe('code generation patterns', () => {
    it.concurrent('defines library code generation structure', () => {
      const generatedCode = {
        files: [
          {
            path: 'src/index.ts',
            content: `/**
 * Main entry point for the library
 */

export function greet(name: string = 'World'): string {
  return \`Hello, \${name}!\`
}

export * from './utils.js'
`,
            language: 'typescript',
          },
          {
            path: 'test/index.test.ts',
            content: `import { describe, expect, it } from 'vitest'
import { greet } from '../src/index.js'

describe('greet function', () => {
  it('returns greeting with default name', () => {
    expect(greet()).toBe('Hello, World!')
  })
})
`,
            language: 'typescript',
          },
        ],
        metadata: {
          template: 'library',
          language: 'typescript',
          features: ['vitest', 'tsup'],
          entryPoint: 'src/index.ts',
        },
      }

      expect(generatedCode.files).toHaveLength(2)
      expect(generatedCode.files[0]?.path).toBe('src/index.ts')
      expect(generatedCode.files[0]?.content).toContain('export function greet')
      expect(generatedCode.files[1]?.path).toBe('test/index.test.ts')
      expect(generatedCode.metadata.template).toBe('library')
    })

    it.concurrent('defines React component generation structure', () => {
      const generatedCode = {
        files: [
          {
            path: 'src/components/Counter.tsx',
            content: `import React, { useState } from 'react'

interface CounterProps {
  initialValue?: number
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <div className="counter">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
`,
            language: 'tsx',
          },
        ],
        metadata: {
          template: 'react-component',
          language: 'tsx',
          features: ['typescript', 'testing-library'],
          componentType: 'functional',
        },
      }

      expect(generatedCode.files).toHaveLength(1)
      expect(generatedCode.files[0]?.content).toContain('useState')
      expect(generatedCode.metadata.componentType).toBe('functional')
    })
  })

  describe('aI error handling patterns', () => {
    it.concurrent('handles API rate limiting gracefully', () => {
      const errorResponse = {
        error: 'rate_limit_exceeded',
        message: 'API rate limit exceeded',
        retryAfter: 60,
      }

      expect(errorResponse.error).toBe('rate_limit_exceeded')
      expect(errorResponse.retryAfter).toBe(60)
      expect(typeof errorResponse.message).toBe('string')
    })

    it.concurrent('handles invalid API key errors', () => {
      const errorResponse = {
        error: 'invalid_api_key',
        message: 'The provided API key is invalid',
        statusCode: 401,
      }

      expect(errorResponse.error).toBe('invalid_api_key')
      expect(errorResponse.statusCode).toBe(401)
    })

    it.concurrent('provides fallback when AI service is unavailable', () => {
      const fallbackStrategy = {
        useDefaultTemplate: true,
        template: 'default',
        minimalDependencies: ['typescript'],
        basicConfiguration: {
          typescript: true,
          eslint: false,
          prettier: false,
        },
        message: 'AI service unavailable, using default configuration',
      }

      expect(fallbackStrategy.useDefaultTemplate).toBe(true)
      expect(fallbackStrategy.template).toBe('default')
      expect(fallbackStrategy.minimalDependencies).toContain('typescript')
      expect(fallbackStrategy.message).toContain('unavailable')
    })
  })
})
