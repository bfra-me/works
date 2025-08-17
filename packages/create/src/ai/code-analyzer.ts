import type {LLMClient} from './llm-client'

/**
 * Represents the severity level of a code quality issue
 */
export type IssueSeverity = 'error' | 'warning' | 'info' | 'suggestion'

/**
 * Represents a category of code quality issue
 */
export type IssueCategory =
  | 'performance'
  | 'security'
  | 'maintainability'
  | 'type-safety'
  | 'testing'
  | 'best-practices'
  | 'accessibility'
  | 'documentation'

/**
 * Represents a specific code quality issue found during analysis
 */
export interface CodeIssue {
  /** Unique identifier for the issue type */
  id: string
  /** Human-readable title of the issue */
  title: string
  /** Detailed description of the issue */
  description: string
  /** Severity level of the issue */
  severity: IssueSeverity
  /** Category the issue belongs to */
  category: IssueCategory
  /** File path where the issue was found */
  filePath: string
  /** Line number where the issue occurs (1-based) */
  lineNumber?: number
  /** Column number where the issue occurs (1-based) */
  columnNumber?: number
  /** The problematic code snippet */
  codeSnippet?: string
  /** Suggested fix or improvement */
  suggestion?: string
  /** Example of how to fix the issue */
  fixExample?: string
  /** URL to documentation or resources */
  documentationUrl?: string
}

/**
 * Configuration options for code analysis
 */
export interface AnalysisOptions {
  /** Whether to include AI-powered analysis */
  useAI?: boolean
  /** Severity levels to include in analysis */
  severityLevels?: IssueSeverity[]
  /** Categories to focus on during analysis */
  categories?: IssueCategory[]
  /** Maximum number of issues to return */
  maxIssues?: number
  /** Whether to include fix suggestions */
  includeSuggestions?: boolean
  /** Whether to include example fixes */
  includeExamples?: boolean
  /** Custom rules to apply during analysis */
  customRules?: string[]
}

/**
 * Result of code quality analysis
 */
export interface AnalysisResult {
  /** List of issues found during analysis */
  issues: CodeIssue[]
  /** Overall quality score (0-100) */
  qualityScore: number
  /** Summary statistics by category */
  summary: {
    [K in IssueCategory]?: {
      count: number
      severity: IssueSeverity
    }
  }
  /** Whether AI analysis was used */
  aiAnalysisUsed: boolean
  /** Time taken for analysis in milliseconds */
  analysisTime: number
  /** Analysis metadata */
  metadata: {
    linesOfCode: number
    filesAnalyzed: number
    analysisEngine: 'ai' | 'static'
    timestamp: string
    analysisTime: number
  }
}

/**
 * Represents a file to be analyzed
 */
export interface AnalysisTarget {
  /** File path */
  filePath: string
  /** File content */
  content: string
  /** File type/language */
  language?: 'typescript' | 'javascript' | 'json' | 'markdown' | 'css' | 'html'
}

/**
 * Built-in static analysis rules
 */
const STATIC_ANALYSIS_RULES = {
  /**
   * Check for console.log statements in production code
   */
  noConsoleLog: (content: string, filePath: string): CodeIssue[] => {
    const issues: CodeIssue[] = []
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      if (line.includes('console.log') && !line.trim().startsWith('//')) {
        issues.push({
          id: 'no-console-log',
          title: 'Console log statement found',
          description: 'Console.log statements should not be present in production code',
          severity: 'warning',
          category: 'best-practices',
          filePath,
          lineNumber: index + 1,
          codeSnippet: line.trim(),
          suggestion: 'Remove console.log or replace with proper logging',
          fixExample: `// Instead of:\n${line.trim()}\n// Use:\nlogger.debug('message')`,
          documentationUrl: 'https://eslint.org/docs/rules/no-console',
        })
      }
    })

    return issues
  },

  /**
   * Check for TODO/FIXME comments
   */
  todoComments: (content: string, filePath: string): CodeIssue[] => {
    const issues: CodeIssue[] = []
    const lines = content.split('\n')
    const todoPattern = /\b(TODO|FIXME|HACK|XXX)\b/i

    lines.forEach((line, index) => {
      const match = line.match(todoPattern)
      if (match) {
        issues.push({
          id: 'todo-comment',
          title: `${match[1]} comment found`,
          description: 'TODO/FIXME comments indicate unfinished work',
          severity: 'info',
          category: 'maintainability',
          filePath,
          lineNumber: index + 1,
          codeSnippet: line.trim(),
          suggestion: 'Complete the task or create a proper issue to track it',
        })
      }
    })

    return issues
  },

  /**
   * Check for any type usage in TypeScript
   */
  anyTypeUsage: (content: string, filePath: string): CodeIssue[] => {
    const issues: CodeIssue[] = []

    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return issues
    }

    const lines = content.split('\n')
    const anyPattern = /:\s*any\b|<any>/g

    lines.forEach((line, index) => {
      if (anyPattern.test(line) && !line.trim().startsWith('//')) {
        issues.push({
          id: 'any-type-usage',
          title: 'Any type usage detected',
          description: 'Using "any" type reduces type safety benefits',
          severity: 'warning',
          category: 'type-safety',
          filePath,
          lineNumber: index + 1,
          codeSnippet: line.trim(),
          suggestion: 'Replace "any" with specific types or generic constraints',
          fixExample:
            '// Use specific types:\ninterface User { name: string; age: number }\n// Or generic constraints:\nfunction process<T extends object>(data: T): T',
          documentationUrl:
            'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any',
        })
      }
    })

    return issues
  },

  /**
   * Check for missing error handling
   */
  missingErrorHandling: (content: string, filePath: string): CodeIssue[] => {
    const issues: CodeIssue[] = []
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      // Check for async/await without try-catch
      if (line.includes('await ') && !content.includes('try {')) {
        const contextStart = Math.max(0, index - 2)
        const contextEnd = Math.min(lines.length, index + 3)
        const context = lines.slice(contextStart, contextEnd).join('\n')

        if (!context.includes('try') && !context.includes('catch')) {
          issues.push({
            id: 'missing-error-handling',
            title: 'Missing error handling for async operation',
            description: 'Async operations should be wrapped in try-catch blocks',
            severity: 'warning',
            category: 'best-practices',
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim(),
            suggestion: 'Wrap async operations in try-catch blocks',
            fixExample:
              "try {\n  const result = await asyncOperation()\n} catch (error) {\n  console.error('Operation failed:', error)\n}",
          })
        }
      }
    })

    return issues
  },

  /**
   * Check for hardcoded URLs and secrets
   */
  hardcodedSecrets: (content: string, filePath: string): CodeIssue[] => {
    const issues: CodeIssue[] = []
    const lines = content.split('\n')

    const secretPatterns = [
      {pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'API Key'},
      {pattern: /password\s*[:=]\s*['"][^'"]+['"]/, type: 'Password'},
      {pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'Secret'},
      {pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/, type: 'Token'},
      {pattern: /https?:\/\/[^\s'"]+\.[^\s'"]+/, type: 'Hardcoded URL'},
    ]

    lines.forEach((line, index) => {
      secretPatterns.forEach(({pattern, type}) => {
        if (pattern.test(line) && !line.trim().startsWith('//')) {
          issues.push({
            id: 'hardcoded-secret',
            title: `Hardcoded ${type.toLowerCase()} detected`,
            description: `${type} should not be hardcoded in source code`,
            severity: 'error',
            category: 'security',
            filePath,
            lineNumber: index + 1,
            codeSnippet: line.trim().replaceAll(/['"][^'"]*['"]/g, "'***'"),
            suggestion: `Use environment variables for ${type.toLowerCase()}`,
            fixExample: `// Instead of hardcoding:\n// const apiKey = 'secret-key'\n// Use environment variables:\nconst apiKey = process.env.API_KEY`,
            documentationUrl: 'https://12factor.net/config',
          })
        }
      })
    })

    return issues
  },
}

/**
 * AI-powered code quality analyzer that provides intelligent suggestions
 * for improving code quality, performance, and maintainability
 */
export class CodeAnalyzer {
  constructor(private readonly llmClient?: LLMClient) {}

  /**
   * Analyze code quality for a single file
   */
  async analyzeFile(
    filePath: string,
    content: string,
    options: AnalysisOptions = {},
  ): Promise<AnalysisResult> {
    const target: AnalysisTarget = {
      filePath,
      content,
      language: this.detectLanguage(filePath),
    }

    return this.analyzeTargets([target], options)
  }

  /**
   * Analyze code quality for multiple files
   */
  async analyzeTargets(
    targets: AnalysisTarget[],
    options: AnalysisOptions = {},
  ): Promise<AnalysisResult> {
    const startTime = Date.now()

    const {
      useAI = true,
      severityLevels = ['error', 'warning', 'info', 'suggestion'],
      categories,
      maxIssues = 100,
      includeSuggestions = true,
      includeExamples = true,
    } = options

    let allIssues: CodeIssue[] = []
    let aiAnalysisUsed = false

    // Perform static analysis first
    for (const target of targets) {
      const staticIssues = this.performStaticAnalysis(target)
      allIssues.push(...staticIssues)
    }

    // Perform AI analysis if available and requested
    if (useAI && this.llmClient) {
      try {
        const aiIssues = await this.performAIAnalysis(targets, options)
        allIssues.push(...aiIssues)
        aiAnalysisUsed = true
      } catch (error) {
        console.warn('AI analysis failed, falling back to static analysis:', error)
      }
    }

    // Filter issues based on options
    allIssues = this.filterIssues(allIssues, {
      severityLevels,
      categories,
      maxIssues,
      includeSuggestions,
      includeExamples,
    })

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(allIssues, targets)

    // Generate summary
    const summary = this.generateSummary(allIssues)

    const analysisTime = Date.now() - startTime
    const totalLines = targets.reduce((sum, target) => sum + target.content.split('\n').length, 0)

    return {
      issues: allIssues,
      qualityScore,
      summary,
      aiAnalysisUsed,
      analysisTime,
      metadata: {
        linesOfCode: totalLines,
        filesAnalyzed: targets.length,
        analysisEngine: aiAnalysisUsed ? 'ai' : 'static',
        timestamp: new Date().toISOString(),
        analysisTime,
      },
    }
  }

  /**
   * Get improvement suggestions for a specific issue
   */
  async getImprovementSuggestions(issue: CodeIssue, context: string): Promise<string[]> {
    if (!this.llmClient) {
      return this.getStaticSuggestions(issue)
    }

    try {
      const prompt = `
Analyze this code quality issue and provide 3-5 specific improvement suggestions:

Issue: ${issue.title}
Description: ${issue.description}
Category: ${issue.category}
Severity: ${issue.severity}

Code context:
\`\`\`
${context}
\`\`\`

Problematic code:
\`\`\`
${issue.codeSnippet ?? 'Not provided'}
\`\`\`

Please provide:
1. Specific actionable improvements
2. Code examples where applicable
3. Best practice recommendations
4. Performance or security considerations

Format as a JSON array of strings.
`

      const response = await this.llmClient.complete(prompt, {
        temperature: 0.3,
        maxTokens: 800,
      })

      if (!response.success || !response.content) {
        console.warn('AI suggestions failed, using static suggestions:', response.error)
        return this.getStaticSuggestions(issue)
      }

      try {
        const suggestions = JSON.parse(response.content.trim()) as string[]
        return Array.isArray(suggestions) ? suggestions : [response.content]
      } catch {
        return response.content.split('\n').filter((line: string) => line.trim().length > 0)
      }
    } catch (error) {
      console.warn('Failed to get AI suggestions, using static suggestions:', error)
      return this.getStaticSuggestions(issue)
    }
  }

  /**
   * Generate a comprehensive quality report
   */
  async generateQualityReport(
    analysisResult: AnalysisResult,
    projectName?: string,
  ): Promise<string> {
    const {issues, qualityScore, summary, metadata} = analysisResult

    const report = [
      `# Code Quality Report${projectName !== undefined && projectName.length > 0 ? ` - ${projectName}` : ''}`,
      '',
      `**Analysis Date:** ${new Date(metadata.timestamp).toLocaleString()}`,
      `**Files Analyzed:** ${metadata.filesAnalyzed}`,
      `**Lines of Code:** ${metadata.linesOfCode.toLocaleString()}`,
      `**Analysis Engine:** ${metadata.analysisEngine}`,
      `**Analysis Time:** ${metadata.analysisTime}ms`,
      '',
      `## Quality Score: ${qualityScore}/100`,
      '',
      this.getQualityScoreDescription(qualityScore),
      '',
      '## Summary by Category',
      '',
    ]

    // Add category summary
    Object.entries(summary).forEach(([category, data]) => {
      if (data !== undefined) {
        report.push(
          `- **${this.formatCategoryName(category as IssueCategory)}**: ${data.count} issues (${data.severity} severity)`,
        )
      }
    })

    report.push('', '## Issues Found', '')

    if (issues.length === 0) {
      report.push('✅ No issues found! Your code looks great.')
    } else {
      // Group issues by severity
      const issuesBySeverity = this.groupIssuesBySeverity(issues)

      Object.entries(issuesBySeverity).forEach(([severity, severityIssues]) => {
        report.push(
          `### ${this.formatSeverityName(severity as IssueSeverity)} (${severityIssues.length})`,
          '',
        )

        severityIssues.forEach((issue, index) => {
          report.push(`#### ${index + 1}. ${issue.title}`)
          report.push(
            `**File:** \`${issue.filePath}\`${issue.lineNumber !== undefined && issue.lineNumber > 0 ? ` (Line ${issue.lineNumber})` : ''}`,
          )
          report.push(`**Category:** ${this.formatCategoryName(issue.category)}`)
          report.push('')
          report.push(issue.description)

          if (issue.codeSnippet !== undefined && issue.codeSnippet.length > 0) {
            report.push('', '**Code:**', '```typescript', issue.codeSnippet, '```')
          }

          if (issue.suggestion !== undefined && issue.suggestion.length > 0) {
            report.push('', '**Suggestion:**', issue.suggestion)
          }

          if (issue.fixExample !== undefined && issue.fixExample.length > 0) {
            report.push('', '**Fix Example:**', '```typescript', issue.fixExample, '```')
          }

          if (issue.documentationUrl !== undefined && issue.documentationUrl.length > 0) {
            report.push('', `**Learn More:** [Documentation](${issue.documentationUrl})`)
          }

          report.push('')
        })
      })
    }

    return report.join('\n')
  }

  /**
   * Detect the programming language of a file based on its extension
   */
  private detectLanguage(filePath: string): AnalysisTarget['language'] {
    const extension = filePath.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'json':
        return 'json'
      case 'md':
      case 'mdx':
        return 'markdown'
      case 'css':
      case 'scss':
      case 'sass':
        return 'css'
      case 'html':
      case 'htm':
        return 'html'
      case undefined:
      default:
        return undefined
    }
  }

  /**
   * Perform static analysis using built-in rules
   */
  private performStaticAnalysis(target: AnalysisTarget): CodeIssue[] {
    const issues: CodeIssue[] = []

    // Apply all static analysis rules
    Object.values(STATIC_ANALYSIS_RULES).forEach(rule => {
      try {
        const ruleIssues = rule(target.content, target.filePath)
        issues.push(...ruleIssues)
      } catch (error) {
        console.warn(`Static analysis rule failed for ${target.filePath}:`, error)
      }
    })

    return issues
  }

  /**
   * Perform AI-powered analysis
   */
  private async performAIAnalysis(
    targets: AnalysisTarget[],
    options: AnalysisOptions,
  ): Promise<CodeIssue[]> {
    if (!this.llmClient) {
      return []
    }

    const issues: CodeIssue[] = []

    for (const target of targets) {
      try {
        const aiIssues = await this.analyzeWithAI(target, options)
        issues.push(...aiIssues)
      } catch (error) {
        console.warn(`AI analysis failed for ${target.filePath}:`, error)
      }
    }

    return issues
  }

  /**
   * Analyze a single target with AI
   */
  private async analyzeWithAI(
    target: AnalysisTarget,
    _options: AnalysisOptions,
  ): Promise<CodeIssue[]> {
    if (!this.llmClient) {
      return []
    }

    const prompt = `
Analyze the following ${target.language ?? 'code'} file for quality issues and improvements:

File: ${target.filePath}
Language: ${target.language ?? 'unknown'}

Code:
\`\`\`${target.language ?? ''}
${target.content}
\`\`\`

Please identify issues in these categories:
- Performance optimizations
- Security vulnerabilities
- Type safety improvements
- Best practices violations
- Maintainability concerns
- Testing opportunities
- Accessibility issues (if applicable)
- Documentation gaps

For each issue, provide:
1. A clear title and description
2. Severity level (error, warning, info, suggestion)
3. Specific line number if applicable
4. Actionable improvement suggestion
5. Example fix if helpful

Format your response as a JSON array of issue objects with this structure:
{
  "title": "Issue title",
  "description": "Detailed description",
  "severity": "error|warning|info|suggestion",
  "category": "performance|security|type-safety|best-practices|maintainability|testing|accessibility|documentation",
  "lineNumber": 1,
  "codeSnippet": "problematic code",
  "suggestion": "how to fix it",
  "fixExample": "example fix"
}

Focus on actionable, specific improvements. Maximum 10 issues per file.
`

    try {
      const response = await this.llmClient.complete(prompt, {
        temperature: 0.3,
        maxTokens: 2000,
      })

      if (!response.success || !response.content) {
        console.warn('AI analysis failed:', response.error)
        return []
      }

      const aiIssues = JSON.parse(response.content.trim()) as unknown[]

      if (!Array.isArray(aiIssues)) {
        console.warn('AI response is not an array')
        return []
      }

      return aiIssues
        .filter(
          (issue): issue is Record<string, unknown> => typeof issue === 'object' && issue !== null,
        )
        .map(
          (issue): CodeIssue => ({
            id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            title: typeof issue.title === 'string' ? issue.title : 'AI-detected issue',
            description:
              typeof issue.description === 'string' ? issue.description : 'No description provided',
            severity: this.isValidSeverity(issue.severity) ? issue.severity : 'info',
            category: this.isValidCategory(issue.category) ? issue.category : 'best-practices',
            filePath: target.filePath,
            lineNumber: typeof issue.lineNumber === 'number' ? issue.lineNumber : undefined,
            codeSnippet: typeof issue.codeSnippet === 'string' ? issue.codeSnippet : undefined,
            suggestion: typeof issue.suggestion === 'string' ? issue.suggestion : undefined,
            fixExample: typeof issue.fixExample === 'string' ? issue.fixExample : undefined,
          }),
        )
    } catch (error) {
      console.warn('Failed to parse AI analysis response:', error)
      return []
    }
  }

  /**
   * Validate if a value is a valid severity level
   */
  private isValidSeverity(value: unknown): value is IssueSeverity {
    return typeof value === 'string' && ['error', 'warning', 'info', 'suggestion'].includes(value)
  }

  /**
   * Validate if a value is a valid issue category
   */
  private isValidCategory(value: unknown): value is IssueCategory {
    return (
      typeof value === 'string' &&
      [
        'performance',
        'security',
        'maintainability',
        'type-safety',
        'testing',
        'best-practices',
        'accessibility',
        'documentation',
      ].includes(value)
    )
  }

  /**
   * Filter issues based on options
   */
  private filterIssues(
    issues: CodeIssue[],
    filters: {
      severityLevels?: IssueSeverity[]
      categories?: IssueCategory[]
      maxIssues?: number
      includeSuggestions?: boolean
      includeExamples?: boolean
    },
  ): CodeIssue[] {
    let filtered = [...issues]

    // Filter by severity
    if (filters.severityLevels && filters.severityLevels.length > 0) {
      filtered = filtered.filter(issue => filters.severityLevels?.includes(issue.severity) ?? false)
    }

    // Filter by category
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(issue => filters.categories?.includes(issue.category) ?? false)
    }

    // Remove suggestions if not requested
    if (!filters.includeSuggestions) {
      filtered = filtered.map(issue => ({...issue, suggestion: undefined}))
    }

    // Remove examples if not requested
    if (!filters.includeExamples) {
      filtered = filtered.map(issue => ({...issue, fixExample: undefined}))
    }

    // Limit number of issues
    if (
      filters.maxIssues !== undefined &&
      filters.maxIssues > 0 &&
      filtered.length > filters.maxIssues
    ) {
      // Sort by severity and take the most important ones
      const severityOrder = {error: 0, warning: 1, info: 2, suggestion: 3}
      filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      filtered = filtered.slice(0, filters.maxIssues)
    }

    return filtered
  }

  /**
   * Calculate overall quality score based on issues found
   */
  private calculateQualityScore(issues: CodeIssue[], targets: AnalysisTarget[]): number {
    if (issues.length === 0) {
      return 100
    }

    const totalLines = targets.reduce((sum, target) => sum + target.content.split('\n').length, 0)
    const severityWeights = {error: 10, warning: 5, info: 2, suggestion: 1}

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity]
    }, 0)

    // Calculate score as percentage, with penalty normalized by lines of code
    const normalizedPenalty = Math.min(totalPenalty / Math.max(totalLines / 10, 1), 100)
    return Math.max(0, Math.round(100 - normalizedPenalty))
  }

  /**
   * Generate summary statistics by category
   */
  private generateSummary(issues: CodeIssue[]): AnalysisResult['summary'] {
    const summary: AnalysisResult['summary'] = {}

    issues.forEach(issue => {
      if (!summary[issue.category]) {
        summary[issue.category] = {
          count: 0,
          severity: issue.severity,
        }
      }

      const categoryData = summary[issue.category]
      if (categoryData) {
        categoryData.count++

        // Use the highest severity for the category
        const severityOrder = {error: 0, warning: 1, info: 2, suggestion: 3}
        if (severityOrder[issue.severity] < severityOrder[categoryData.severity]) {
          categoryData.severity = issue.severity
        }
      }
    })

    return summary
  }

  /**
   * Get static fallback suggestions for issues
   */
  private getStaticSuggestions(issue: CodeIssue): string[] {
    switch (issue.category) {
      case 'performance':
        return [
          'Consider using more efficient algorithms or data structures',
          'Look for opportunities to cache expensive computations',
          'Optimize loops and reduce unnecessary iterations',
          'Use appropriate TypeScript compiler optimizations',
        ]
      case 'security':
        return [
          'Validate and sanitize all user inputs',
          'Use environment variables for sensitive data',
          'Implement proper authentication and authorization',
          'Keep dependencies up to date',
        ]
      case 'type-safety':
        return [
          'Replace "any" types with specific interfaces or unions',
          'Add proper type annotations to function parameters',
          'Use strict TypeScript compiler options',
          'Implement proper error handling with typed exceptions',
        ]
      case 'testing':
        return [
          'Add unit tests for critical business logic',
          'Implement integration tests for API endpoints',
          'Use test-driven development practices',
          'Maintain good test coverage (aim for 80%+)',
        ]
      case 'best-practices':
        return [
          'Follow established coding standards and conventions',
          'Use modern language features and best practices',
          'Consider refactoring complex functions into smaller ones',
          'Implement proper error handling and logging',
        ]
      case 'maintainability':
        return [
          'Improve code documentation and comments',
          'Reduce code complexity and cyclomatic complexity',
          'Extract common functionality into reusable modules',
          'Follow single responsibility principle',
        ]
      case 'accessibility':
        return [
          'Add proper ARIA labels and semantic HTML',
          'Ensure keyboard navigation support',
          'Provide alt text for images and media',
          'Test with screen readers and accessibility tools',
        ]
      case 'documentation':
        return [
          'Add comprehensive JSDoc comments for public APIs',
          'Create README files with usage examples',
          'Document configuration options and environment variables',
          'Maintain up-to-date API documentation',
        ]
      default:
        return [
          'Follow established coding standards and conventions',
          'Improve code documentation and comments',
          'Consider refactoring complex functions into smaller ones',
          'Use modern language features and best practices',
        ]
    }
  }

  /**
   * Get quality score description
   */
  private getQualityScoreDescription(score: number): string {
    if (score >= 90) {
      return '🟢 **Excellent** - Your code follows best practices with minimal issues.'
    }
    if (score >= 80) {
      return '🟡 **Good** - Your code is solid with a few minor improvements needed.'
    }
    if (score >= 70) {
      return '🟠 **Fair** - Your code works but has some quality issues to address.'
    }
    if (score >= 60) {
      return '🔴 **Poor** - Your code has significant quality issues that should be addressed.'
    }
    return '⚫ **Critical** - Your code has major issues that need immediate attention.'
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: IssueCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
  }

  /**
   * Format severity name for display
   */
  private formatSeverityName(severity: IssueSeverity): string {
    const icons = {error: '🚨', warning: '⚠️', info: 'ℹ️', suggestion: '💡'}
    return `${icons[severity]} ${severity.charAt(0).toUpperCase() + severity.slice(1)}`
  }

  /**
   * Group issues by severity
   */
  private groupIssuesBySeverity(issues: CodeIssue[]): Record<IssueSeverity, CodeIssue[]> {
    const groups: Record<IssueSeverity, CodeIssue[]> = {
      error: [],
      warning: [],
      info: [],
      suggestion: [],
    }

    issues.forEach(issue => {
      groups[issue.severity].push(issue)
    })

    return groups
  }
}
