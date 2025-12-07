import {consola} from 'consola'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {HelpSystem, helpSystem, showErrorHelp} from '../../src/utils/help.js'

vi.mock('consola', () => ({
  consola: {
    box: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const getBoxCall = (): string => {
  const calls = vi.mocked(consola.box).mock.calls
  return (calls[0]?.[0] as string) ?? ''
}

const getInfoCall = (): string => {
  const calls = vi.mocked(consola.info).mock.calls
  return (calls[0]?.[0] as string) ?? ''
}

describe('HelpSystem', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  describe('constructor', () => {
    it('should initialize with default topics and commands', () => {
      const newSystem = new HelpSystem()
      expect(newSystem).toBeDefined()
    })
  })

  describe('getTopicHelp', () => {
    it('should return templates topic', () => {
      const topic = system.getTopicHelp('templates')
      expect(topic).toBeDefined()
      expect(topic?.name).toBe('Templates')
      expect(topic?.description).toContain('template')
      expect(topic?.examples.length).toBeGreaterThan(0)
      expect(topic?.relatedTopics).toContain('customization')
    })

    it('should return customization topic', () => {
      const topic = system.getTopicHelp('customization')
      expect(topic).toBeDefined()
      expect(topic?.name).toBe('Customization')
      expect(topic?.description).toContain('Configuring')
      expect(topic?.examples.length).toBeGreaterThan(0)
      expect(topic?.relatedTopics).toContain('templates')
    })

    it('should return ai topic', () => {
      const topic = system.getTopicHelp('ai')
      expect(topic).toBeDefined()
      expect(topic?.name).toBe('AI Features')
      expect(topic?.description).toContain('AI-powered')
      expect(topic?.examples.length).toBeGreaterThan(0)
    })

    it('should return troubleshooting topic', () => {
      const topic = system.getTopicHelp('troubleshooting')
      expect(topic).toBeDefined()
      expect(topic?.name).toBe('Troubleshooting')
      expect(topic?.examples.length).toBeGreaterThan(0)
    })

    it('should return undefined for unknown topic', () => {
      const topic = system.getTopicHelp('unknown-topic')
      expect(topic).toBeUndefined()
    })
  })

  describe('getCommandHelp', () => {
    it('should return create command help', () => {
      const cmd = system.getCommandHelp('create')
      expect(cmd).toBeDefined()
      expect(cmd?.command).toBe('create')
      expect(cmd?.description).toContain('new project')
      expect(cmd?.usage).toContain('npx')
      expect(cmd?.options.length).toBeGreaterThan(0)
      expect(cmd?.examples.length).toBeGreaterThan(0)
    })

    it('should include template option', () => {
      const cmd = system.getCommandHelp('create')
      const templateOption = cmd?.options.find(o => o.flag.includes('--template'))
      expect(templateOption).toBeDefined()
      expect(templateOption?.description).toContain('Template')
    })

    it('should include description option', () => {
      const cmd = system.getCommandHelp('create')
      const descOption = cmd?.options.find(o => o.flag.includes('--description'))
      expect(descOption).toBeDefined()
    })

    it('should include author option', () => {
      const cmd = system.getCommandHelp('create')
      const authorOption = cmd?.options.find(o => o.flag.includes('--author'))
      expect(authorOption).toBeDefined()
    })

    it('should include package-manager option', () => {
      const cmd = system.getCommandHelp('create')
      const pmOption = cmd?.options.find(o => o.flag.includes('--package-manager'))
      expect(pmOption).toBeDefined()
      expect(pmOption?.description).toContain('npm')
    })

    it('should include ai option', () => {
      const cmd = system.getCommandHelp('create')
      const aiOption = cmd?.options.find(o => o.flag.includes('--ai'))
      expect(aiOption).toBeDefined()
      expect(aiOption?.description).toContain('AI-powered')
    })

    it('should include describe option', () => {
      const cmd = system.getCommandHelp('create')
      const describeOption = cmd?.options.find(o => o.flag.includes('--describe'))
      expect(describeOption).toBeDefined()
      expect(describeOption?.description).toContain('Natural language')
    })

    it('should return undefined for unknown command', () => {
      const cmd = system.getCommandHelp('unknown-command')
      expect(cmd).toBeUndefined()
    })
  })

  describe('showContextualHelp', () => {
    it('should show template selection help', () => {
      system.showContextualHelp('template-selection')
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('Template Selection Help')
    })

    it('should show customization help', () => {
      system.showContextualHelp('customization')
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('Project Customization Help')
    })

    it('should show error help', () => {
      system.showContextualHelp('error')
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('Troubleshooting Help')
    })

    it('should show general help', () => {
      system.showContextualHelp('general')
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('@bfra.me/create')
    })

    it('should default to general help for unknown context', () => {
      system.showContextualHelp('unknown' as 'general')
      expect(consola.box).toHaveBeenCalled()
    })
  })

  describe('showExamples', () => {
    it('should show usage examples', () => {
      system.showExamples()
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('Usage Examples')
      expect(call).toContain('Basic Project Creation')
      expect(call).toContain('Library with Custom Settings')
    })
  })

  describe('showAdvancedTips', () => {
    it('should show advanced tips', () => {
      system.showAdvancedTips()
      expect(consola.box).toHaveBeenCalled()
      const call = getBoxCall()
      expect(call).toContain('Advanced Tips')
      expect(call).toContain('Environment Variables')
      expect(call).toContain('AI-Powered Features')
      expect(call).toContain('OPENAI_API_KEY')
      expect(call).toContain('ANTHROPIC_API_KEY')
    })
  })
})

describe('helpSystem singleton', () => {
  it('should export a global help system instance', () => {
    expect(helpSystem).toBeDefined()
    expect(helpSystem).toBeInstanceOf(HelpSystem)
  })

  it('should have initialized topics', () => {
    const topic = helpSystem.getTopicHelp('templates')
    expect(topic).toBeDefined()
  })

  it('should have initialized commands', () => {
    const cmd = helpSystem.getCommandHelp('create')
    expect(cmd).toBeDefined()
  })
})

describe('showErrorHelp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show network error help', () => {
    const error = new Error('Connection refused')
    showErrorHelp('network', error)

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('Connection refused'))
    expect(consola.info).toHaveBeenCalled()
    const infoCall = getInfoCall()
    expect(infoCall).toContain('Network Error Help')
    expect(infoCall).toContain('internet connection')
  })

  it('should show permission error help', () => {
    const error = new Error('EACCES: permission denied')
    showErrorHelp('permission', error)

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('permission denied'))
    expect(consola.info).toHaveBeenCalled()
    const infoCall = getInfoCall()
    expect(infoCall).toContain('Permission Error Help')
  })

  it('should show template error help', () => {
    const error = new Error('Template not found')
    showErrorHelp('template', error)

    expect(consola.error).toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalled()
    const infoCall = getInfoCall()
    expect(infoCall).toContain('Template Error Help')
    expect(infoCall).toContain('built-in template')
  })

  it('should show validation error help', () => {
    const error = new Error('Invalid project name')
    showErrorHelp('validation', error)

    expect(consola.error).toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalled()
    const infoCall = getInfoCall()
    expect(infoCall).toContain('Validation Error Help')
    expect(infoCall).toContain('lowercase')
  })

  it('should show AI error help', () => {
    const error = new Error('API key not found')
    showErrorHelp('ai', error)

    expect(consola.error).toHaveBeenCalled()
    expect(consola.info).toHaveBeenCalled()
    const infoCall = getInfoCall()
    expect(infoCall).toContain('AI Feature Error Help')
    expect(infoCall).toContain('OPENAI_API_KEY')
    expect(infoCall).toContain('ANTHROPIC_API_KEY')
  })

  it('should show default error help for unknown error type', () => {
    showErrorHelp('unknown')

    expect(consola.error).toHaveBeenCalled()
    expect(consola.box).toHaveBeenCalled()
  })

  it('should handle missing error object', () => {
    showErrorHelp('network')

    expect(consola.error).toHaveBeenCalledWith(expect.stringContaining('network'))
    expect(consola.info).toHaveBeenCalled()
  })

  it('should show error type when no error message', () => {
    showErrorHelp('validation')

    expect(consola.error).toHaveBeenCalledWith('Error: validation')
  })
})

describe('template-selection help content', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  it('should include built-in templates list', () => {
    system.showContextualHelp('template-selection')
    const call = getBoxCall()
    expect(call).toContain('default')
    expect(call).toContain('library')
    expect(call).toContain('cli')
    expect(call).toContain('node')
    expect(call).toContain('react')
  })

  it('should include custom template sources', () => {
    system.showContextualHelp('template-selection')
    const call = getBoxCall()
    expect(call).toContain('GitHub')
    expect(call).toContain('URL')
    expect(call).toContain('Local')
  })
})

describe('customization help content', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  it('should include project details guidance', () => {
    system.showContextualHelp('customization')
    const call = getBoxCall()
    expect(call).toContain('Name')
    expect(call).toContain('Description')
    expect(call).toContain('Author')
    expect(call).toContain('Version')
  })

  it('should include package manager options', () => {
    system.showContextualHelp('customization')
    const call = getBoxCall()
    expect(call).toContain('npm')
    expect(call).toContain('yarn')
    expect(call).toContain('pnpm')
    expect(call).toContain('bun')
  })
})

describe('general help content', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  it('should include quick start examples', () => {
    system.showContextualHelp('general')
    const call = getBoxCall()
    expect(call).toContain('Quick Start')
    expect(call).toContain('npx @bfra.me/create')
  })

  it('should include AI-powered quick start', () => {
    system.showContextualHelp('general')
    const call = getBoxCall()
    expect(call).toContain('AI-Powered Quick Start')
    expect(call).toContain('--describe')
  })

  it('should include available commands', () => {
    system.showContextualHelp('general')
    const call = getBoxCall()
    expect(call).toContain('Available Commands')
    expect(call).toContain('create')
  })

  it('should include interactive vs non-interactive info', () => {
    system.showContextualHelp('general')
    const call = getBoxCall()
    expect(call).toContain('Interactive Mode')
    expect(call).toContain('Non-Interactive Mode')
  })
})

describe('advanced tips content', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  it('should include environment variables', () => {
    system.showAdvancedTips()
    const call = getBoxCall()
    expect(call).toContain('NO_COLOR')
    expect(call).toContain('DEBUG')
    expect(call).toContain('CI')
  })

  it('should include template development tips', () => {
    system.showAdvancedTips()
    const call = getBoxCall()
    expect(call).toContain('Template Development')
    expect(call).toContain('template.json')
    expect(call).toContain('Eta')
  })

  it('should include performance tips', () => {
    system.showAdvancedTips()
    const call = getBoxCall()
    expect(call).toContain('Performance Tips')
    expect(call).toContain('pnpm')
    expect(call).toContain('caching')
  })
})

describe('examples content', () => {
  let system: HelpSystem

  beforeEach(() => {
    vi.clearAllMocks()
    system = new HelpSystem()
  })

  it('should include basic project creation example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('Basic Project Creation')
    expect(call).toContain('npx @bfra.me/create my-project')
  })

  it('should include library creation example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('Library with Custom Settings')
    expect(call).toContain('--template=library')
  })

  it('should include react app example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('React App')
    expect(call).toContain('--template=react')
  })

  it('should include custom GitHub template example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('Custom GitHub Template')
    expect(call).toContain('github:user/repo')
  })

  it('should include non-interactive mode example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('Non-Interactive Mode')
    expect(call).toContain('--no-interactive')
    expect(call).toContain('--force')
  })

  it('should include CLI tool example', () => {
    system.showExamples()
    const call = getBoxCall()
    expect(call).toContain('CLI Tool Project')
    expect(call).toContain('--template=cli')
  })
})
