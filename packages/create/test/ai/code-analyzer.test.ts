import type {LLMResponse} from '../../src/types.js'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {
  CodeAnalyzer,
  type AnalysisResult,
  type AnalysisTarget,
  type CodeIssue,
} from '../../src/ai/code-analyzer.js'

/**
 * Minimal mock interface for LLMClient used in tests.
 * Only includes the methods actually used by CodeAnalyzer.
 */
interface MockLLMClient {
  complete: ReturnType<typeof vi.fn>
}

const createMockLLMClient = (): MockLLMClient => ({
  complete: vi.fn(),
})

describe('CodeAnalyzer', () => {
  let mockLLMClient: MockLLMClient
  let analyzer: CodeAnalyzer

  beforeEach(() => {
    vi.clearAllMocks()
    mockLLMClient = createMockLLMClient()
    // CodeAnalyzer accepts any object with complete method
    analyzer = new CodeAnalyzer(mockLLMClient as never)
  })

  describe('constructor', () => {
    it('should create analyzer without LLM client', () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      expect(analyzerWithoutAI).toBeDefined()
    })

    it('should create analyzer with LLM client', () => {
      const analyzerWithAI = new CodeAnalyzer(mockLLMClient as never)
      expect(analyzerWithAI).toBeDefined()
    })
  })

  describe('analyzeFile', () => {
    it('should analyze a single TypeScript file', async () => {
      const code = `
const x: any = 'test';
console.log(x);
`
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: '[]',
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', code)

      expect(result).toBeDefined()
      expect(result.issues).toBeDefined()
      expect(result.qualityScore).toBeDefined()
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should detect console.log statements', async () => {
      const code = `
function test() {
  console.log('debug message');
  return 42;
}
`
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: '[]',
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      const consoleIssues = result.issues.filter(i => i.id === 'no-console-log')
      expect(consoleIssues.length).toBeGreaterThan(0)
      expect(consoleIssues[0]?.severity).toBe('warning')
      expect(consoleIssues[0]?.category).toBe('best-practices')
    })

    it('should detect TODO comments', async () => {
      const code = `
// TODO: implement this feature
function notImplemented() {
  // FIXME: this is broken
  return null;
}
`
      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      const todoIssues = result.issues.filter(i => i.id === 'todo-comment')
      expect(todoIssues.length).toBe(2)
      expect(todoIssues[0]?.severity).toBe('info')
      expect(todoIssues[0]?.category).toBe('maintainability')
    })

    it('should detect any type usage in TypeScript', async () => {
      const code = `
const data: any = fetchData();
function process<any>(input: any): any {
  return input;
}
`
      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      const anyIssues = result.issues.filter(i => i.id === 'any-type-usage')
      expect(anyIssues.length).toBeGreaterThan(0)
      expect(anyIssues[0]?.severity).toBe('warning')
      expect(anyIssues[0]?.category).toBe('type-safety')
    })

    it('should not detect any type in non-TypeScript files', async () => {
      const code = `
const data: any = fetchData();
`
      const result = await analyzer.analyzeFile('test.js', code, {useAI: false})

      const anyIssues = result.issues.filter(i => i.id === 'any-type-usage')
      expect(anyIssues.length).toBe(0)
    })

    it('should detect hardcoded secrets', async () => {
      const code = `
const apiKey = 'sk-1234567890abcdef';
const password = 'supersecret123';
`
      const result = await analyzer.analyzeFile('config.ts', code, {useAI: false})

      const secretIssues = result.issues.filter(i => i.id === 'hardcoded-secret')
      expect(secretIssues.length).toBeGreaterThan(0)
      expect(secretIssues[0]?.severity).toBe('error')
      expect(secretIssues[0]?.category).toBe('security')
    })

    it('should detect hardcoded URLs', async () => {
      const code = `
const apiUrl = 'https://api.example.com/v1/users';
`
      const result = await analyzer.analyzeFile('api.ts', code, {useAI: false})

      const urlIssues = result.issues.filter(
        i => i.id === 'hardcoded-secret' && i.title.includes('url'),
      )
      expect(urlIssues.length).toBeGreaterThan(0)
    })

    it('should not flag commented out code', async () => {
      const code = `
// console.log('this is commented');
function test() {
  return 42;
}
`
      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      const consoleIssues = result.issues.filter(i => i.id === 'no-console-log')
      expect(consoleIssues.length).toBe(0)
    })
  })

  describe('analyzeTargets', () => {
    it('should analyze multiple files', async () => {
      const targets: AnalysisTarget[] = [
        {filePath: 'file1.ts', content: 'console.log("test");', language: 'typescript'},
        {filePath: 'file2.ts', content: 'const x: any = 1;', language: 'typescript'},
      ]

      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: '[]',
      } as LLMResponse)

      const result = await analyzer.analyzeTargets(targets, {useAI: true})

      expect(result.metadata.filesAnalyzed).toBe(2)
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should calculate quality score', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'clean.ts',
          content: 'function add(a: number, b: number): number { return a + b; }',
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {useAI: false})

      expect(result.qualityScore).toBeGreaterThanOrEqual(0)
      expect(result.qualityScore).toBeLessThanOrEqual(100)
    })

    it('should return perfect score for clean code', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'clean.ts',
          content: `
function add(a: number, b: number): number {
  return a + b;
}

function multiply(a: number, b: number): number {
  return a * b;
}
`,
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {useAI: false})

      expect(result.qualityScore).toBe(100)
      expect(result.issues.length).toBe(0)
    })

    it('should filter issues by severity', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'test.ts',
          content: `
// TODO: fix this
console.log('debug');
const apiKey = 'secret-key-12345678901234567890';
`,
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {
        useAI: false,
        severityLevels: ['error'],
      })

      result.issues.forEach(issue => {
        expect(issue.severity).toBe('error')
      })
    })

    it('should filter issues by category', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'test.ts',
          content: `
// TODO: fix this
console.log('debug');
const apiKey = 'secret-key-12345678901234567890';
`,
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {
        useAI: false,
        categories: ['security'],
      })

      result.issues.forEach(issue => {
        expect(issue.category).toBe('security')
      })
    })

    it('should limit number of issues', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'test.ts',
          content: `
console.log('1');
console.log('2');
console.log('3');
console.log('4');
console.log('5');
`,
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {
        useAI: false,
        maxIssues: 2,
      })

      expect(result.issues.length).toBeLessThanOrEqual(2)
    })

    it('should remove suggestions when not requested', async () => {
      const targets: AnalysisTarget[] = [{filePath: 'test.ts', content: 'console.log("test");'}]

      const result = await analyzer.analyzeTargets(targets, {
        useAI: false,
        includeSuggestions: false,
      })

      result.issues.forEach(issue => {
        expect(issue.suggestion).toBeUndefined()
      })
    })

    it('should remove examples when not requested', async () => {
      const targets: AnalysisTarget[] = [{filePath: 'test.ts', content: 'console.log("test");'}]

      const result = await analyzer.analyzeTargets(targets, {
        useAI: false,
        includeExamples: false,
      })

      result.issues.forEach(issue => {
        expect(issue.fixExample).toBeUndefined()
      })
    })
  })

  describe('AI analysis', () => {
    it('should use AI analysis when available', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify([
          {
            title: 'AI-detected issue',
            description: 'This is an AI-detected issue',
            severity: 'warning',
            category: 'best-practices',
            lineNumber: 5,
          },
        ]),
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      expect(result.aiAnalysisUsed).toBe(true)
      expect(mockLLMClient.complete).toHaveBeenCalled()
    })

    it('should fallback to static analysis when AI fails', async () => {
      vi.mocked(mockLLMClient.complete).mockRejectedValue(new Error('AI unavailable'))

      const result = await analyzer.analyzeFile('test.ts', 'console.log("test");', {useAI: true})

      // AI analysis is considered "used" even if individual file analysis fails
      // because the AI analysis path was attempted
      expect(result.aiAnalysisUsed).toBe(true)
      // Static analysis should still run and find issues
      expect(result.issues.length).toBeGreaterThan(0)
    })

    it('should handle invalid AI response', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: 'not valid json',
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      expect(result).toBeDefined()
    })

    it('should handle AI returning non-array', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify({issues: []}),
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      expect(result).toBeDefined()
    })

    it('should handle AI response with missing fields', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify([{title: 'Partial issue'}, {description: 'Only description'}, {}]),
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      expect(result.aiAnalysisUsed).toBe(true)
      const aiIssues = result.issues.filter(i => i.id.startsWith('ai-'))
      expect(aiIssues.length).toBe(3)
    })

    it('should validate severity from AI response', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify([
          {title: 'Valid severity', severity: 'error'},
          {title: 'Invalid severity', severity: 'critical'},
        ]),
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      const aiIssues = result.issues.filter(i => i.id.startsWith('ai-'))
      const invalidSeverityIssue = aiIssues.find(i => i.title === 'Invalid severity')
      expect(invalidSeverityIssue?.severity).toBe('info')
    })

    it('should validate category from AI response', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify([
          {title: 'Valid category', category: 'security'},
          {title: 'Invalid category', category: 'unknown-category'},
        ]),
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      const aiIssues = result.issues.filter(i => i.id.startsWith('ai-'))
      const invalidCategoryIssue = aiIssues.find(i => i.title === 'Invalid category')
      expect(invalidCategoryIssue?.category).toBe('best-practices')
    })

    it('should skip AI analysis when useAI is false', async () => {
      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: false})

      expect(result.aiAnalysisUsed).toBe(false)
      expect(mockLLMClient.complete).not.toHaveBeenCalled()
    })

    it('should handle AI response with unsuccessful status', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: false,
        error: 'Rate limited',
      } as LLMResponse)

      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})

      expect(result).toBeDefined()
    })
  })

  describe('getImprovementSuggestions', () => {
    const mockIssue: CodeIssue = {
      id: 'test-issue',
      title: 'Test Issue',
      description: 'A test issue for suggestions',
      severity: 'warning',
      category: 'best-practices',
      filePath: 'test.ts',
    }

    it('should get AI suggestions when available', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: JSON.stringify([
          'Use const instead of let',
          'Add type annotations',
          'Extract to separate function',
        ]),
      } as LLMResponse)

      const suggestions = await analyzer.getImprovementSuggestions(mockIssue, 'const x = 1;')

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBe(3)
    })

    it('should fallback to static suggestions when AI fails', async () => {
      vi.mocked(mockLLMClient.complete).mockRejectedValue(new Error('AI unavailable'))

      const suggestions = await analyzer.getImprovementSuggestions(mockIssue, 'const x = 1;')

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return static suggestions when AI response is unsuccessful', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: false,
        error: 'Rate limited',
      } as LLMResponse)

      const suggestions = await analyzer.getImprovementSuggestions(mockIssue, 'const x = 1;')

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should handle non-JSON AI response', async () => {
      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: 'Use better naming\nAdd comments\nRefactor code',
      } as LLMResponse)

      const suggestions = await analyzer.getImprovementSuggestions(mockIssue, 'const x = 1;')

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBe(3)
    })

    it('should provide static suggestions without AI client', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        mockIssue,
        'const x = 1;',
      )

      expect(suggestions).toBeDefined()
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should provide category-specific static suggestions for performance', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const performanceIssue: CodeIssue = {...mockIssue, category: 'performance'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        performanceIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('algorithm') || s.toLowerCase().includes('cache'),
        ),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for security', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const securityIssue: CodeIssue = {...mockIssue, category: 'security'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        securityIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('validate') || s.toLowerCase().includes('sanitize'),
        ),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for type-safety', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const typeSafetyIssue: CodeIssue = {...mockIssue, category: 'type-safety'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        typeSafetyIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(s => s.toLowerCase().includes('any') || s.toLowerCase().includes('type')),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for testing', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const testingIssue: CodeIssue = {...mockIssue, category: 'testing'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        testingIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('test') || s.toLowerCase().includes('coverage'),
        ),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for maintainability', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const maintainabilityIssue: CodeIssue = {...mockIssue, category: 'maintainability'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        maintainabilityIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('documentation') || s.toLowerCase().includes('complexity'),
        ),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for accessibility', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const accessibilityIssue: CodeIssue = {...mockIssue, category: 'accessibility'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        accessibilityIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('aria') || s.toLowerCase().includes('keyboard'),
        ),
      ).toBe(true)
    })

    it('should provide category-specific static suggestions for documentation', async () => {
      const analyzerWithoutAI = new CodeAnalyzer()
      const documentationIssue: CodeIssue = {...mockIssue, category: 'documentation'}

      const suggestions = await analyzerWithoutAI.getImprovementSuggestions(
        documentationIssue,
        'const x = 1;',
      )

      expect(
        suggestions.some(
          s => s.toLowerCase().includes('jsdoc') || s.toLowerCase().includes('readme'),
        ),
      ).toBe(true)
    })
  })

  describe('generateQualityReport', () => {
    it('should generate a comprehensive report', async () => {
      const result: AnalysisResult = {
        issues: [
          {
            id: 'test-1',
            title: 'Test Issue',
            description: 'A test issue',
            severity: 'warning',
            category: 'best-practices',
            filePath: 'test.ts',
            lineNumber: 10,
            codeSnippet: 'console.log("test")',
            suggestion: 'Remove console.log',
            fixExample: 'logger.debug("test")',
            documentationUrl: 'https://example.com',
          },
        ],
        qualityScore: 85,
        summary: {
          'best-practices': {count: 1, severity: 'warning'},
        },
        aiAnalysisUsed: false,
        analysisTime: 100,
        metadata: {
          linesOfCode: 50,
          filesAnalyzed: 1,
          analysisEngine: 'static',
          timestamp: new Date().toISOString(),
          analysisTime: 100,
        },
      }

      const report = await analyzer.generateQualityReport(result, 'test-project')

      expect(report).toContain('# Code Quality Report')
      expect(report).toContain('test-project')
      expect(report).toContain('Quality Score: 85/100')
      expect(report).toContain('Test Issue')
      expect(report).toContain('console.log("test")')
    })

    it('should handle report with no issues', async () => {
      const result: AnalysisResult = {
        issues: [],
        qualityScore: 100,
        summary: {},
        aiAnalysisUsed: false,
        analysisTime: 50,
        metadata: {
          linesOfCode: 20,
          filesAnalyzed: 1,
          analysisEngine: 'static',
          timestamp: new Date().toISOString(),
          analysisTime: 50,
        },
      }

      const report = await analyzer.generateQualityReport(result)

      expect(report).toContain('No issues found')
      expect(report).toContain('100/100')
    })

    it('should generate report without project name', async () => {
      const result: AnalysisResult = {
        issues: [],
        qualityScore: 100,
        summary: {},
        aiAnalysisUsed: true,
        analysisTime: 50,
        metadata: {
          linesOfCode: 20,
          filesAnalyzed: 1,
          analysisEngine: 'ai',
          timestamp: new Date().toISOString(),
          analysisTime: 50,
        },
      }

      const report = await analyzer.generateQualityReport(result)

      expect(report).toContain('# Code Quality Report')
      expect(report).not.toMatch(/^# Code Quality Report - /)
    })

    it('should show quality score descriptions', async () => {
      const createResult = (score: number): AnalysisResult => ({
        issues: [],
        qualityScore: score,
        summary: {},
        aiAnalysisUsed: false,
        analysisTime: 50,
        metadata: {
          linesOfCode: 20,
          filesAnalyzed: 1,
          analysisEngine: 'static',
          timestamp: new Date().toISOString(),
          analysisTime: 50,
        },
      })

      const excellentReport = await analyzer.generateQualityReport(createResult(95))
      expect(excellentReport).toContain('Excellent')

      const goodReport = await analyzer.generateQualityReport(createResult(85))
      expect(goodReport).toContain('Good')

      const fairReport = await analyzer.generateQualityReport(createResult(75))
      expect(fairReport).toContain('Fair')

      const poorReport = await analyzer.generateQualityReport(createResult(65))
      expect(poorReport).toContain('Poor')

      const criticalReport = await analyzer.generateQualityReport(createResult(50))
      expect(criticalReport).toContain('Critical')
    })

    it('should group issues by severity in report', async () => {
      const result: AnalysisResult = {
        issues: [
          {
            id: '1',
            title: 'Error Issue',
            description: '',
            severity: 'error',
            category: 'security',
            filePath: 'a.ts',
          },
          {
            id: '2',
            title: 'Warning Issue',
            description: '',
            severity: 'warning',
            category: 'best-practices',
            filePath: 'b.ts',
          },
          {
            id: '3',
            title: 'Info Issue',
            description: '',
            severity: 'info',
            category: 'maintainability',
            filePath: 'c.ts',
          },
        ],
        qualityScore: 70,
        summary: {},
        aiAnalysisUsed: false,
        analysisTime: 100,
        metadata: {
          linesOfCode: 100,
          filesAnalyzed: 3,
          analysisEngine: 'static',
          timestamp: new Date().toISOString(),
          analysisTime: 100,
        },
      }

      const report = await analyzer.generateQualityReport(result)

      expect(report).toContain('Error')
      expect(report).toContain('Warning')
      expect(report).toContain('Info')
    })
  })

  describe('language detection', () => {
    it('should detect TypeScript files', async () => {
      const result = await analyzer.analyzeFile('component.tsx', 'const x: any = 1;', {
        useAI: false,
      })
      const anyIssues = result.issues.filter(i => i.id === 'any-type-usage')
      expect(anyIssues.length).toBeGreaterThan(0)
    })

    it('should detect JavaScript files', async () => {
      const result = await analyzer.analyzeFile('script.js', 'console.log("test");', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle JSON files', async () => {
      const result = await analyzer.analyzeFile('package.json', '{"name": "test"}', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle Markdown files', async () => {
      const result = await analyzer.analyzeFile('README.md', '# Title', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle CSS files', async () => {
      const result = await analyzer.analyzeFile('styles.css', '.class { color: red; }', {
        useAI: false,
      })
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle SCSS files', async () => {
      const result = await analyzer.analyzeFile('styles.scss', '$color: red;', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle HTML files', async () => {
      const result = await analyzer.analyzeFile('index.html', '<html></html>', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle MDX files', async () => {
      const result = await analyzer.analyzeFile('doc.mdx', '# Title', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })

    it('should handle unknown file types', async () => {
      const result = await analyzer.analyzeFile('file.xyz', 'content', {useAI: false})
      expect(result.metadata.filesAnalyzed).toBe(1)
    })
  })

  describe('summary generation', () => {
    it('should generate summary by category', async () => {
      const code = `
// TODO: fix this
console.log('debug');
const x: any = 1;
`
      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      expect(result.summary).toBeDefined()
      expect(Object.keys(result.summary).length).toBeGreaterThan(0)
    })

    it('should track highest severity per category', async () => {
      const targets: AnalysisTarget[] = [
        {
          filePath: 'test.ts',
          content: `
console.log('1');
console.log('2');
`,
        },
      ]

      const result = await analyzer.analyzeTargets(targets, {useAI: false})

      // Use non-conditional assertion pattern
      const bestPractices = result.summary['best-practices']
      expect(bestPractices).toBeDefined()
      expect(bestPractices?.count).toBeGreaterThanOrEqual(2)
      expect(bestPractices?.severity).toBe('warning')
    })
  })

  describe('metadata tracking', () => {
    it('should track analysis time', async () => {
      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: false})

      expect(result.analysisTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.analysisTime).toBeGreaterThanOrEqual(0)
    })

    it('should track lines of code', async () => {
      const code = `line1
line2
line3
line4
line5`
      const result = await analyzer.analyzeFile('test.ts', code, {useAI: false})

      expect(result.metadata.linesOfCode).toBe(5)
    })

    it('should include timestamp', async () => {
      const result = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: false})

      expect(result.metadata.timestamp).toBeDefined()
      expect(new Date(result.metadata.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should track analysis engine type', async () => {
      const staticResult = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: false})
      expect(staticResult.metadata.analysisEngine).toBe('static')

      vi.mocked(mockLLMClient.complete).mockResolvedValue({
        success: true,
        content: '[]',
      } as LLMResponse)

      const aiResult = await analyzer.analyzeFile('test.ts', 'const x = 1;', {useAI: true})
      expect(aiResult.metadata.analysisEngine).toBe('ai')
    })
  })
})
