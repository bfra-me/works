import type {AIConfig, CodeGenerationRequest} from '../types.js'
import {LLMClient} from './llm-client.js'

/**
 * Result of code generation request
 */
export interface CodeGenerationResult {
  /** Whether generation was successful */
  success: boolean
  /** Generated code content */
  code?: string
  /** Target file path suggestion */
  filePath?: string
  /** Additional files that might be needed */
  additionalFiles?: {
    path: string
    content: string
    description: string
  }[]
  /** Setup instructions */
  instructions?: string[]
  /** Error message if generation failed */
  error?: string
  /** Quality score of generated code (0-1) */
  quality?: number
}

/**
 * AI-powered code generator for creating boilerplate code and configurations
 */
export class CodeGenerator {
  private readonly llmClient: LLMClient

  constructor(config?: Partial<AIConfig>) {
    this.llmClient = new LLMClient(config)
  }

  /**
   * Generate code based on request specifications
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    if (!this.llmClient.isAIAvailable()) {
      return this.createFallbackCode(request)
    }

    const prompt = this.buildGenerationPrompt(request)
    const response = await this.llmClient.complete(prompt, {
      systemPrompt: this.getSystemPrompt(request.type),
      maxTokens: 4000,
      temperature: 0.2, // Lower temperature for more consistent code generation
    })

    if (!response.success) {
      console.warn('AI code generation failed, using fallback:', response.error)
      return this.createFallbackCode(request)
    }

    try {
      return this.parseGenerationResponse(response.content, request)
    } catch (error) {
      console.warn('Failed to parse AI code generation response:', error)
      return this.createFallbackCode(request)
    }
  }

  /**
   * Generate React component
   */
  async generateComponent(
    name: string,
    _props?: Record<string, string>,
    features?: string[],
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'component',
      description: `React component named ${name}`,
      language: 'typescript',
      context: {
        projectType: 'web-app',
        requirements: features,
        style: 'functional',
      },
    })
  }

  /**
   * Generate TypeScript function
   */
  async generateFunction(
    name: string,
    parameters: {name: string; type: string}[],
    returnType: string,
    description: string,
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'function',
      description: `Function ${name} that ${description}`,
      language: 'typescript',
      context: {
        requirements: [
          `Parameters: ${parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`,
          `Returns: ${returnType}`,
        ],
      },
    })
  }

  /**
   * Generate test file
   */
  async generateTest(
    targetFile: string,
    testFramework: 'vitest' | 'jest' = 'vitest',
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'test',
      description: `Test file for ${targetFile}`,
      language: 'typescript',
      context: {
        existingCode: `// Target file: ${targetFile}`,
        requirements: [`Use ${testFramework} testing framework`],
      },
    })
  }

  /**
   * Generate configuration file
   */
  async generateConfig(
    configType: 'eslint' | 'prettier' | 'tsconfig' | 'package.json' | 'vite' | 'webpack',
    projectContext?: {
      type?: string
      features?: string[]
      dependencies?: string[]
    },
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'config',
      description: `${configType} configuration file`,
      language: configType === 'package.json' ? 'json' : 'typescript',
      context: {
        projectType: projectContext?.type,
        requirements: [
          ...(projectContext?.features ?? []),
          ...(projectContext?.dependencies?.map(dep => `Uses ${dep}`) ?? []),
        ],
      },
    })
  }

  private buildGenerationPrompt(request: CodeGenerationRequest): string {
    const parts = []

    parts.push(`Generate ${request.type} code with the following specifications:`)
    parts.push(`Description: ${request.description}`)
    parts.push(`Language: ${request.language}`)

    if (request.context?.projectType != null && request.context.projectType.trim() !== '') {
      parts.push(`Project Type: ${request.context.projectType}`)
    }

    if (request.context?.requirements && request.context.requirements.length > 0) {
      parts.push(`Requirements: ${request.context.requirements.join(', ')}`)
    }

    if (request.context?.existingCode != null && request.context.existingCode.trim() !== '') {
      parts.push(`Existing Code Context:`)
      parts.push(request.context.existingCode)
    }

    if (request.context?.style) {
      parts.push(`Code Style: ${request.context.style}`)
    }

    parts.push('')
    parts.push('Please provide:')
    parts.push('1. Clean, well-documented code')
    parts.push('2. TypeScript types where applicable')
    parts.push('3. Best practices and modern patterns')
    parts.push('4. Appropriate imports and exports')
    parts.push('5. JSDoc comments for public APIs')

    parts.push('')
    parts.push('Respond in JSON format:')
    parts.push(
      JSON.stringify(
        {
          success: true,
          code: '// Generated code here',
          filePath: 'suggested/file/path.ts',
          additionalFiles: [
            {
              path: 'additional/file.ts',
              content: '// Additional content',
              description: 'Purpose of this file',
            },
          ],
          instructions: ['Step 1: Install dependencies', 'Step 2: Configure project'],
          quality: 0.9,
        },
        null,
        2,
      ),
    )

    return parts.join('\n')
  }

  private getSystemPrompt(codeType: CodeGenerationRequest['type']): string {
    const basePrompt = `You are an expert software developer specializing in TypeScript, React, Node.js, and modern web development. Generate clean, maintainable, and well-documented code following current best practices.

Always include:
- Proper TypeScript types
- JSDoc comments for public APIs
- Error handling where appropriate
- Modern ES6+ syntax
- Consistent code style
- Security considerations`

    const typeSpecificPrompts = {
      component: `\n\nFor React components:
- Use functional components with hooks
- Include proper prop types
- Handle edge cases and loading states
- Follow accessibility best practices
- Use semantic HTML elements`,

      function: `\n\nFor functions:
- Pure functions where possible
- Proper input validation
- Clear return types
- Handle error cases gracefully
- Include comprehensive JSDoc`,

      class: `\n\nFor classes:
- Follow SOLID principles
- Use proper access modifiers
- Include constructor validation
- Implement appropriate interfaces
- Add comprehensive documentation`,

      test: `\n\nFor tests:
- Comprehensive test coverage
- Clear test descriptions
- Use appropriate test patterns (AAA)
- Mock external dependencies
- Test both happy path and edge cases`,

      config: `\n\nFor configuration files:
- Include helpful comments
- Use appropriate defaults
- Validate configuration options
- Follow established conventions
- Include extension points`,

      documentation: `\n\nFor documentation:
- Clear and concise explanations
- Include code examples
- Cover common use cases
- Explain configuration options
- Provide troubleshooting tips`,
    }

    return basePrompt + (typeSpecificPrompts[codeType] ?? '')
  }

  private parseGenerationResponse(
    content: string,
    request: CodeGenerationRequest,
  ): CodeGenerationResult {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback: try to extract code blocks
      const codeMatch = content.match(/```(?:typescript|javascript|json|jsx|tsx)?\n([\s\S]*?)\n```/)
      if (codeMatch) {
        return {
          success: true,
          code: codeMatch[1],
          filePath: this.suggestFilePath(request),
          quality: 0.6, // Lower quality since we couldn't parse full response
        }
      }
      throw new Error('No valid code found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as CodeGenerationResult

    return {
      success: parsed.success ?? true,
      code: parsed.code,
      filePath: parsed.filePath ?? this.suggestFilePath(request),
      additionalFiles: Array.isArray(parsed.additionalFiles) ? parsed.additionalFiles : [],
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
      quality: Math.max(0, Math.min(1, parsed.quality ?? 0.7)),
      error: parsed.error,
    }
  }

  private suggestFilePath(request: CodeGenerationRequest): string {
    const extension =
      request.language === 'javascript' ? '.js' : request.language === 'json' ? '.json' : '.ts'

    switch (request.type) {
      case 'component':
        return `src/components/Component${extension === '.ts' ? '.tsx' : '.jsx'}`
      case 'function':
        return `src/utils/functions${extension}`
      case 'class':
        return `src/classes/Class${extension}`
      case 'test':
        return `src/__tests__/test.test${extension}`
      case 'config':
        if (request.description.includes('eslint')) return 'eslint.config.ts'
        if (request.description.includes('prettier')) return 'prettier.config.js'
        if (request.description.includes('tsconfig')) return 'tsconfig.json'
        if (request.description.includes('package.json')) return 'package.json'
        return `config${extension}`
      case 'documentation':
        return 'README.md'
      default:
        return `src/generated${extension}`
    }
  }

  private createFallbackCode(request: CodeGenerationRequest): CodeGenerationResult {
    const templates = {
      component: `import React from 'react'

export interface ComponentProps {
  // Add your props here
}

export function Component(props: ComponentProps): JSX.Element {
  return (
    <div>
      {/* Component implementation */}
    </div>
  )
}`,

      function: `/**
 * Generated function
 */
export function generatedFunction(): void {
  // Implementation here
}`,

      class: `/**
 * Generated class
 */
export class GeneratedClass {
  constructor() {
    // Constructor implementation
  }
}`,

      test: `import { describe, it, expect } from 'vitest'

describe('Generated Test', () => {
  it('should work', () => {
    expect(true).toBe(true)
  })
})`,

      config:
        request.language === 'json'
          ? '{\n  "//": "Generated configuration"\n}'
          : 'export default {\n  // Generated configuration\n}',

      documentation: `# Generated Documentation

## Overview

This is generated documentation.

## Usage

\`\`\`typescript
// Usage example
\`\`\``,
    }

    return {
      success: true,
      code: templates[request.type] ?? '// Generated code',
      filePath: this.suggestFilePath(request),
      instructions: [
        'Review and customize the generated code',
        'Add proper error handling',
        'Include tests if not already present',
      ],
      quality: 0.5, // Lower quality for fallback
    }
  }
}

/**
 * Create a code generator instance
 */
export function createCodeGenerator(config?: Partial<AIConfig>): CodeGenerator {
  return new CodeGenerator(config)
}
