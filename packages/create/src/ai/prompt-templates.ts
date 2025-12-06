/**
 * AI Prompt Template System
 * Part of Phase 3: AI System Modernization (TASK-024)
 *
 * Provides consistent, reusable prompt templates for LLM interactions.
 */

/**
 * Supported prompt template types
 */
export type PromptTemplateType =
  | 'project-analysis'
  | 'existing-project-analysis'
  | 'dependency-recommendation'
  | 'code-generation'
  | 'documentation-generation'
  | 'configuration-optimization'
  | 'assistant-introduction'
  | 'error-explanation'

/**
 * Template variables for interpolation
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | string[] | undefined
}

/**
 * Prompt template definition
 */
export interface PromptTemplate {
  /** Template type identifier */
  type: PromptTemplateType
  /** System prompt for context */
  systemPrompt: string
  /** User prompt template with {{variable}} placeholders */
  userPrompt: string
  /** Suggested temperature for this template */
  suggestedTemperature: number
  /** Suggested max tokens for this template */
  suggestedMaxTokens: number
}

/**
 * Creates the system prompt for project analysis
 */
function getProjectAnalysisSystemPrompt(): string {
  return `You are an expert software development consultant specializing in TypeScript, Node.js, and modern web development. Your role is to analyze project requirements and provide intelligent recommendations for:

1. Project type classification
2. Essential dependencies and packages
3. Development tools and frameworks
4. Project templates and scaffolding
5. Best practices and configuration

Always consider:
- Modern best practices and industry standards
- TypeScript-first development
- Developer experience and productivity
- Maintainability and scalability
- Testing and quality assurance
- Security and performance

Provide practical, actionable recommendations with clear reasoning.
Always respond with valid JSON.`
}

/**
 * Creates the system prompt for existing project analysis
 */
function getExistingProjectAnalysisSystemPrompt(): string {
  return `You are a software development consultant analyzing an existing project. Evaluate the current setup and suggest improvements that would:

1. Enhance developer experience
2. Improve code quality and maintainability
3. Add missing essential tools
4. Follow modern best practices
5. Increase productivity

Focus on practical improvements that provide clear value without unnecessary complexity.
Always respond with valid JSON.`
}

/**
 * Creates the system prompt for dependency recommendations
 */
function getDependencyRecommendationSystemPrompt(): string {
  return `You are an expert in JavaScript/TypeScript package ecosystems. Analyze the project context and recommend dependencies that would:

1. Solve specific problems or add needed functionality
2. Integrate well with existing dependencies
3. Be actively maintained and well-documented
4. Have good TypeScript support
5. Follow security best practices

Provide specific version recommendations when possible.
Always respond with valid JSON.`
}

/**
 * Creates the system prompt for code generation
 */
function getCodeGenerationSystemPrompt(): string {
  return `You are an expert TypeScript developer. Generate high-quality, production-ready code that:

1. Follows modern TypeScript best practices
2. Uses functional patterns where appropriate
3. Includes proper error handling
4. Is well-documented with JSDoc comments
5. Is properly typed with no 'any' types
6. Follows the existing codebase patterns

Generate complete, working code without placeholders or TODOs.`
}

/**
 * Creates the system prompt for documentation generation
 */
function getDocumentationGenerationSystemPrompt(): string {
  return `You are a technical writer specializing in software documentation. Create clear, comprehensive documentation that:

1. Is well-structured with appropriate headings
2. Includes practical examples
3. Explains both how and why
4. Is appropriate for the target audience
5. Follows common documentation standards

Use Markdown formatting for the output.`
}

/**
 * Creates the system prompt for configuration optimization
 */
function getConfigurationOptimizationSystemPrompt(): string {
  return `You are an expert in JavaScript/TypeScript project configuration. Analyze configurations and suggest optimizations that:

1. Improve build performance
2. Enable stricter type checking
3. Enhance code quality rules
4. Optimize for the project type
5. Follow current best practices

Explain the reasoning behind each suggestion.
Always respond with valid JSON.`
}

/**
 * Creates the system prompt for assistant introduction
 */
function getAssistantIntroductionSystemPrompt(): string {
  return `You are an AI-powered project creation assistant. Help users create and configure their projects by:

1. Understanding their requirements through conversation
2. Asking clarifying questions when needed
3. Providing clear explanations of recommendations
4. Guiding them through the setup process
5. Offering alternatives when appropriate

Be friendly, professional, and concise.`
}

/**
 * Creates the system prompt for error explanations
 */
function getErrorExplanationSystemPrompt(): string {
  return `You are a helpful debugging assistant. Explain errors and provide solutions that:

1. Clearly explain what went wrong
2. Identify the root cause
3. Provide actionable fix suggestions
4. Reference relevant documentation
5. Suggest preventive measures

Be concise but thorough.`
}

/**
 * Project analysis user prompt template
 */
const PROJECT_ANALYSIS_USER_PROMPT = `Please analyze the following project requirements and provide recommendations:

{{#if projectName}}Project Name: {{projectName}}{{/if}}
{{#if description}}Description: {{description}}{{/if}}
{{#if keywords}}Keywords: {{keywords}}{{/if}}
{{#if requirements}}Requirements: {{requirements}}{{/if}}
{{#if preferences}}Preferences: {{preferences}}{{/if}}

Please provide analysis in the following JSON format:
{
  "projectType": "library | cli | web-app | api | config | other",
  "confidence": 0.95,
  "description": "Brief project summary",
  "features": ["feature1", "feature2"],
  "dependencies": [
    {
      "name": "package-name",
      "description": "Package description",
      "reason": "Why this package is recommended",
      "isDev": true,
      "confidence": 0.8
    }
  ],
  "techStack": [
    {
      "category": "runtime | framework | build-tool | testing | linting | other",
      "name": "Technology name",
      "reason": "Why this is recommended",
      "confidence": 0.8
    }
  ],
  "templates": [
    {
      "source": {"type": "builtin", "location": "template-name"},
      "reason": "Why this template fits",
      "confidence": 0.8,
      "matchScore": 0.9
    }
  ]
}`

/**
 * Existing project analysis user prompt template
 */
const EXISTING_PROJECT_ANALYSIS_USER_PROMPT = `Analyze the existing project structure and suggest improvements:

{{packageJson}}

Provide recommendations for:
1. Missing dependencies that could be useful
2. Development tools that could improve the workflow
3. Configuration improvements
4. Best practices that could be applied

Respond in the same JSON format as for new projects.`

/**
 * Gets a prompt template by type.
 *
 * @param type - The template type
 * @returns The prompt template
 */
export function getPromptTemplate(type: PromptTemplateType): PromptTemplate {
  switch (type) {
    case 'project-analysis':
      return {
        type,
        systemPrompt: getProjectAnalysisSystemPrompt(),
        userPrompt: PROJECT_ANALYSIS_USER_PROMPT,
        suggestedTemperature: 0.3,
        suggestedMaxTokens: 3000,
      }

    case 'existing-project-analysis':
      return {
        type,
        systemPrompt: getExistingProjectAnalysisSystemPrompt(),
        userPrompt: EXISTING_PROJECT_ANALYSIS_USER_PROMPT,
        suggestedTemperature: 0.3,
        suggestedMaxTokens: 2000,
      }

    case 'dependency-recommendation':
      return {
        type,
        systemPrompt: getDependencyRecommendationSystemPrompt(),
        userPrompt: `Analyze the following project and recommend dependencies:

{{projectContext}}

Respond with a JSON array of dependency recommendations.`,
        suggestedTemperature: 0.3,
        suggestedMaxTokens: 2000,
      }

    case 'code-generation':
      return {
        type,
        systemPrompt: getCodeGenerationSystemPrompt(),
        userPrompt: `Generate {{codeType}} for the following:

Description: {{description}}
{{#if language}}Language: {{language}}{{/if}}
{{#if existingCode}}Existing code context:
\`\`\`
{{existingCode}}
\`\`\`{{/if}}
{{#if requirements}}Requirements: {{requirements}}{{/if}}

Generate complete, production-ready code.`,
        suggestedTemperature: 0.2,
        suggestedMaxTokens: 4000,
      }

    case 'documentation-generation':
      return {
        type,
        systemPrompt: getDocumentationGenerationSystemPrompt(),
        userPrompt: `Generate {{docType}} documentation for:

Project: {{projectName}}
{{#if description}}Description: {{description}}{{/if}}
{{#if features}}Features: {{features}}{{/if}}
{{#if codeContext}}Code context:
\`\`\`
{{codeContext}}
\`\`\`{{/if}}

Generate comprehensive documentation in Markdown format.`,
        suggestedTemperature: 0.4,
        suggestedMaxTokens: 3000,
      }

    case 'configuration-optimization':
      return {
        type,
        systemPrompt: getConfigurationOptimizationSystemPrompt(),
        userPrompt: `Analyze and optimize the following configuration:

Configuration type: {{configType}}
Current configuration:
\`\`\`json
{{currentConfig}}
\`\`\`
{{#if projectContext}}Project context: {{projectContext}}{{/if}}

Respond with JSON containing suggested optimizations and explanations.`,
        suggestedTemperature: 0.3,
        suggestedMaxTokens: 2000,
      }

    case 'assistant-introduction':
      return {
        type,
        systemPrompt: getAssistantIntroductionSystemPrompt(),
        userPrompt: `Hi! I'm your AI project assistant. I'll help you create the perfect project setup. Tell me about what you want to build!`,
        suggestedTemperature: 0.7,
        suggestedMaxTokens: 500,
      }

    case 'error-explanation':
      return {
        type,
        systemPrompt: getErrorExplanationSystemPrompt(),
        userPrompt: `Explain the following error and suggest solutions:

Error: {{errorMessage}}
{{#if errorCode}}Error code: {{errorCode}}{{/if}}
{{#if context}}Context: {{context}}{{/if}}
{{#if stackTrace}}Stack trace:
\`\`\`
{{stackTrace}}
\`\`\`{{/if}}

Provide a clear explanation and actionable solutions.`,
        suggestedTemperature: 0.3,
        suggestedMaxTokens: 1500,
      }
  }
}

/**
 * Renders a prompt template with variables.
 *
 * @param template - The prompt template
 * @param variables - Variables to interpolate
 * @returns Rendered user prompt string
 */
export function renderPrompt(template: PromptTemplate, variables: TemplateVariables): string {
  let result = template.userPrompt

  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined) {
      continue
    }

    const stringValue = Array.isArray(value) ? value.join(', ') : String(value)

    result = result.replaceAll(`{{${key}}}`, stringValue)
  }

  result = processConditionals(result, variables)
  result = cleanupUnresolvedPlaceholders(result)

  return result.trim()
}

/**
 * Processes conditional blocks in template
 */
function processConditionals(template: string, variables: TemplateVariables): string {
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  const matches = Array.from(template.matchAll(conditionalRegex))

  let result = template

  for (const match of matches) {
    const fullMatch = match[0]
    const varName = match[1]
    const content = match[2]

    if (varName == null || content == null) {
      continue
    }

    const value = variables[varName]
    const hasValue =
      value !== undefined &&
      value !== '' &&
      value !== false &&
      !(Array.isArray(value) && value.length === 0)

    result = result.replaceAll(fullMatch, hasValue ? content : '')
  }

  return result
}

/**
 * Removes unresolved placeholders from template
 */
function cleanupUnresolvedPlaceholders(template: string): string {
  return template.replaceAll(/\{\{[^}]+\}\}/g, '').replaceAll(/\n{3,}/g, '\n\n')
}

/**
 * Builds a complete prompt with system and user messages.
 *
 * @param type - The template type
 * @param variables - Variables to interpolate
 * @returns Object with systemPrompt and userPrompt
 */
export function buildPrompt(
  type: PromptTemplateType,
  variables: TemplateVariables,
): {systemPrompt: string; userPrompt: string; temperature: number; maxTokens: number} {
  const template = getPromptTemplate(type)
  const userPrompt = renderPrompt(template, variables)

  return {
    systemPrompt: template.systemPrompt,
    userPrompt,
    temperature: template.suggestedTemperature,
    maxTokens: template.suggestedMaxTokens,
  }
}

/**
 * Gets all available template types.
 *
 * @returns Array of template type identifiers
 */
export function getAvailableTemplateTypes(): PromptTemplateType[] {
  return [
    'project-analysis',
    'existing-project-analysis',
    'dependency-recommendation',
    'code-generation',
    'documentation-generation',
    'configuration-optimization',
    'assistant-introduction',
    'error-explanation',
  ]
}
