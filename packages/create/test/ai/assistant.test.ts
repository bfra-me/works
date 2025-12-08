import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const mockIsAIAvailable = vi.fn().mockReturnValue(true)
const mockComplete = vi.fn().mockResolvedValue({success: true, content: 'Test response'})
const mockAnalyzeProject = vi.fn().mockResolvedValue({
  projectType: 'typescript-library',
  features: ['typescript', 'eslint', 'prettier'],
  templates: [
    {
      source: {location: 'default'},
      confidence: 0.9,
      reason: 'Best match for TypeScript library',
    },
  ],
  dependencies: [
    {name: 'typescript', description: 'TypeScript compiler'},
    {name: 'eslint', description: 'Linting'},
  ],
})

const mockText = vi.fn()
const mockSelect = vi.fn()
const mockMultiselect = vi.fn()
const mockConfirm = vi.fn()
const mockIntro = vi.fn()
const mockOutro = vi.fn()
const mockSpinnerStart = vi.fn()
const mockSpinnerStop = vi.fn()
const mockSpinner = vi.fn(() => ({
  start: mockSpinnerStart,
  stop: mockSpinnerStop,
  message: vi.fn(),
}))

vi.mock('@clack/prompts', () => ({
  confirm: mockConfirm,
  intro: mockIntro,
  isCancel: (value: unknown) => value === Symbol.for('cancel'),
  multiselect: mockMultiselect,
  outro: mockOutro,
  select: mockSelect,
  spinner: mockSpinner,
  text: mockText,
}))

vi.mock('../../src/ai/llm-client.js', () => ({
  LLMClient: class MockLLMClient {
    isAIAvailable = mockIsAIAvailable
    complete = mockComplete
  },
}))

vi.mock('../../src/ai/project-analyzer.js', () => ({
  ProjectAnalyzer: class MockProjectAnalyzer {
    analyzeProject = mockAnalyzeProject
  },
}))

const {AIAssistant, createAIAssistant} = await import('../../src/ai/assistant.js')

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
    mockText.mockResolvedValue('A TypeScript library for data validation')
    mockSelect.mockResolvedValue('default')
    mockMultiselect.mockResolvedValue(['typescript', 'eslint'])
    mockConfirm.mockResolvedValue(true)
    mockAnalyzeProject.mockResolvedValue({
      projectType: 'typescript-library',
      features: ['typescript', 'eslint', 'prettier'],
      templates: [{source: {location: 'default'}, confidence: 0.9, reason: 'Best match'}],
      dependencies: [{name: 'typescript', description: 'TypeScript'}],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const assistant = new AIAssistant()
      expect(assistant).toBeInstanceOf(AIAssistant)
    })

    it('should create instance with custom config', () => {
      const config = {provider: 'openai' as const, maxTokens: 4000}
      const assistant = new AIAssistant(config)
      expect(assistant).toBeInstanceOf(AIAssistant)
    })
  })

  describe('isAIAvailable', () => {
    it('should return true when LLM client is available', () => {
      mockIsAIAvailable.mockReturnValue(true)
      const assistant = new AIAssistant()
      expect(assistant.isAIAvailable()).toBe(true)
    })

    it('should return false when LLM client is not available', () => {
      mockIsAIAvailable.mockReturnValue(false)
      const assistant = new AIAssistant()
      expect(assistant.isAIAvailable()).toBe(false)
    })
  })

  describe('continueSession', () => {
    it('should return null for non-existent session', async () => {
      const assistant = new AIAssistant()
      const result = await assistant.continueSession('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('startAssistSession', () => {
    it('should call intro with expected message', async () => {
      const assistant = new AIAssistant()
      await assistant.startAssistSession()
      expect(mockIntro).toHaveBeenCalledWith('🤖 AI Project Assistant')
    })

    it('should fallback to traditional setup when AI is not available', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result).toEqual({
        name: 'my-project',
        template: 'default',
        description: undefined,
        interactive: true,
      })
    })

    it('should use initial options in fallback mode', async () => {
      mockIsAIAvailable.mockReturnValue(false)
      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession({
        name: 'my-custom-project',
        template: 'react-app',
      })

      expect(result.name).toBe('my-custom-project')
      expect(result.template).toBe('react-app')
    })

    it('should complete conversational setup when AI is available', async () => {
      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result).toBeDefined()
      expect(result.name).toBeDefined()
      expect(mockOutro).toHaveBeenCalledWith('✨ Perfect! Your project configuration is ready.')
    })

    it('should gather project description via text prompt', async () => {
      const assistant = new AIAssistant()
      await assistant.startAssistSession()

      expect(mockText).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What would you like to build? Describe your project:',
        }),
      )
    })

    it('should show spinner during project analysis', async () => {
      const assistant = new AIAssistant()
      await assistant.startAssistSession()

      expect(mockSpinnerStart).toHaveBeenCalledWith('🧠 Analyzing your project requirements...')
      expect(mockSpinnerStop).toHaveBeenCalledWith('✅ Analysis complete!')
    })

    it('should handle user cancellation during description', async () => {
      mockText.mockResolvedValueOnce(Symbol('cancel'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.interactive).toBe(true)
      expect(result.name).toBe('my-project')
    })

    it('should handle project name cancellation', async () => {
      mockText.mockResolvedValueOnce('A TypeScript library').mockResolvedValueOnce(Symbol('cancel'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.interactive).toBe(true)
    })

    it('should use provided initial name without prompting for name', async () => {
      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession({name: 'preset-name'})

      expect(result.name).toBe('preset-name')
    })

    it('should select features via multiselect', async () => {
      mockMultiselect.mockResolvedValueOnce(['typescript', 'eslint', 'vitest'])

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.features).toBe('typescript,eslint,vitest')
    })

    it('should select package manager via select', async () => {
      mockSelect.mockResolvedValue('pnpm')

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.packageManager).toBe('pnpm')
    })

    it('should handle confirmation rejection and restart', async () => {
      mockConfirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result).toBeDefined()
    })

    it('should not restart when user declines restart option', async () => {
      mockConfirm
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result).toBeDefined()
    })

    it('should handle analysis failure gracefully', async () => {
      mockAnalyzeProject.mockRejectedValueOnce(new Error('Analysis failed'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(mockSpinnerStop).toHaveBeenCalledWith('❌ Analysis failed')
      expect(result).toEqual(
        expect.objectContaining({
          interactive: true,
        }),
      )
    })

    it('should handle single template recommendation with confirmation', async () => {
      mockAnalyzeProject.mockResolvedValueOnce({
        projectType: 'typescript-library',
        features: ['typescript'],
        templates: [
          {
            source: {location: 'ts-lib'},
            confidence: 0.95,
            reason: 'Perfect match',
          },
        ],
        dependencies: [],
      })

      mockConfirm.mockResolvedValueOnce(true)

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.template).toBe('ts-lib')
    })

    it('should use default template when single recommendation is rejected', async () => {
      mockAnalyzeProject.mockResolvedValueOnce({
        projectType: 'typescript-library',
        features: ['typescript'],
        templates: [
          {
            source: {location: 'ts-lib'},
            confidence: 0.95,
            reason: 'Perfect match',
          },
        ],
        dependencies: [],
      })

      mockConfirm.mockResolvedValueOnce(false)

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.template).toBe('default')
    })

    it('should use default template when no templates recommended', async () => {
      mockAnalyzeProject.mockResolvedValueOnce({
        projectType: 'unknown',
        features: [],
        templates: [],
        dependencies: [],
      })

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.template).toBe('default')
    })

    it('should use default features when no features recommended', async () => {
      mockAnalyzeProject.mockResolvedValueOnce({
        projectType: 'unknown',
        features: [],
        templates: [],
        dependencies: [],
      })

      const assistant = new AIAssistant()
      const result = await assistant.startAssistSession()

      expect(result.features).toBe('typescript,eslint,prettier')
    })
  })

  describe('createAIAssistant factory', () => {
    it('should create AIAssistant instance', () => {
      const assistant = createAIAssistant()
      expect(assistant).toBeInstanceOf(AIAssistant)
    })

    it('should pass config to AIAssistant constructor', () => {
      const config = {provider: 'anthropic' as const, temperature: 0.5}
      const assistant = createAIAssistant(config)
      expect(assistant).toBeInstanceOf(AIAssistant)
    })
  })
})

describe('AIAssistant session management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
    mockText.mockResolvedValue('Test project')
    mockSelect.mockResolvedValue('default')
    mockMultiselect.mockResolvedValue(['typescript'])
    mockConfirm.mockResolvedValue(true)
    mockAnalyzeProject.mockResolvedValue({
      projectType: 'typescript-library',
      features: ['typescript'],
      templates: [{source: {location: 'default'}, confidence: 0.9, reason: 'Test'}],
      dependencies: [],
    })
  })

  it('should track prompts throughout session', async () => {
    const assistant = new AIAssistant()
    await assistant.startAssistSession()

    expect(mockText).toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalled()
    expect(mockMultiselect).toHaveBeenCalled()
    expect(mockConfirm).toHaveBeenCalled()
  })
})

describe('AIAssistant formatting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
    mockConfirm.mockResolvedValue(true)
    mockAnalyzeProject.mockResolvedValue({
      projectType: 'typescript-library',
      features: ['typescript'],
      templates: [{source: {location: 'default'}, confidence: 0.9, reason: 'Test'}],
      dependencies: [],
    })
  })

  it('should format project summary correctly', async () => {
    mockText.mockResolvedValue('A data validation library')
    mockSelect.mockResolvedValue('default').mockResolvedValue('pnpm')
    mockMultiselect.mockResolvedValue(['typescript', 'eslint'])

    const assistant = new AIAssistant()
    await assistant.startAssistSession({name: 'my-validator'})

    expect(mockOutro).toHaveBeenCalledWith('✨ Perfect! Your project configuration is ready.')
  })

  it('should format analysis insights with project type', async () => {
    mockText.mockResolvedValue('A React web app')
    mockSelect.mockResolvedValue('react').mockResolvedValue('npm')
    mockMultiselect.mockResolvedValue(['react', 'typescript'])

    mockAnalyzeProject.mockResolvedValueOnce({
      projectType: 'react-app',
      features: ['react', 'typescript', 'vite'],
      templates: [
        {source: {location: 'react-vite'}, confidence: 0.92, reason: 'React with Vite'},
        {source: {location: 'react-cra'}, confidence: 0.85, reason: 'Create React App'},
      ],
      dependencies: [
        {name: 'react', description: 'React library'},
        {name: 'react-dom', description: 'React DOM'},
        {name: 'vite', description: 'Build tool'},
      ],
    })

    const assistant = new AIAssistant()
    await assistant.startAssistSession()

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Which template would you like to use?',
      }),
    )
  })
})

describe('AIAssistant validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAIAvailable.mockReturnValue(true)
    mockAnalyzeProject.mockResolvedValue({
      projectType: 'typescript-library',
      features: ['typescript'],
      templates: [{source: {location: 'default'}, confidence: 0.9, reason: 'Test'}],
      dependencies: [],
    })
  })

  it('should validate project description length', async () => {
    mockText.mockImplementation(
      async (options: {validate?: (value: string) => string | undefined}) => {
        const validate = options.validate
        expect(validate).toBeDefined()
        if (typeof validate === 'function') {
          const shortError = validate('short')
          // eslint-disable-next-line vitest/no-conditional-expect -- testing validation callback
          expect(shortError).toBe(
            'Please provide a more detailed description (at least 10 characters)',
          )
        }
        return 'A TypeScript library for testing'
      },
    )

    mockSelect.mockResolvedValue('default')
    mockMultiselect.mockResolvedValue(['typescript'])
    mockConfirm.mockResolvedValue(true)

    const assistant = new AIAssistant()
    await assistant.startAssistSession()
  })

  it('should validate project name format', async () => {
    mockText
      .mockResolvedValueOnce('A TypeScript library')
      .mockImplementation(async (options: {validate?: (value: string) => string | undefined}) => {
        const validate = options.validate
        expect(validate).toBeDefined()
        if (typeof validate === 'function') {
          const emptyError = validate('')
          // eslint-disable-next-line vitest/no-conditional-expect -- testing validation callback
          expect(emptyError).toBe('Project name is required')

          const invalidError = validate('invalid name!')
          // eslint-disable-next-line vitest/no-conditional-expect -- testing validation callback
          expect(invalidError).toBe(
            'Project name can only contain letters, numbers, hyphens, underscores, @ and /',
          )
        }
        return 'valid-project-name'
      })

    mockSelect.mockResolvedValue('default')
    mockMultiselect.mockResolvedValue(['typescript'])
    mockConfirm.mockResolvedValue(true)

    const assistant = new AIAssistant()
    await assistant.startAssistSession()
  })
})
