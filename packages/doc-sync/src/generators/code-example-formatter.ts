/**
 * @bfra.me/doc-sync/generators/code-example-formatter - Syntax-highlighted code blocks from JSDoc examples
 */

import type {ExportedFunction, ExportedType, PackageAPI} from '../types'

/**
 * Options for code example formatting
 */
export interface CodeExampleOptions {
  /** Default language for code blocks */
  readonly defaultLanguage?: string
  /** Whether to add function name as title */
  readonly includeTitle?: boolean
  /** Maximum number of examples per function */
  readonly maxExamplesPerFunction?: number
  /** Whether to wrap examples in collapsible sections */
  readonly collapsible?: boolean
}

/**
 * Default options for code example formatting
 */
const DEFAULT_OPTIONS: Required<CodeExampleOptions> = {
  defaultLanguage: 'typescript',
  includeTitle: true,
  maxExamplesPerFunction: 3,
  collapsible: false,
}

export function formatCodeExamples(api: PackageAPI, options: CodeExampleOptions = {}): string {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options}
  const examples: string[] = []

  for (const fn of api.functions) {
    const fnExamples = formatFunctionExamples(fn, mergedOptions)
    if (fnExamples.length > 0) {
      examples.push(fnExamples)
    }
  }

  for (const type of api.types) {
    const typeExamples = formatTypeExamples(type, mergedOptions)
    if (typeExamples.length > 0) {
      examples.push(typeExamples)
    }
  }

  return examples.join('\n\n')
}

export function formatFunctionExamples(
  fn: ExportedFunction,
  options: CodeExampleOptions = {},
): string {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options}

  if (fn.jsdoc?.examples === undefined || fn.jsdoc.examples.length === 0) {
    return ''
  }

  const exampleCount = Math.min(fn.jsdoc.examples.length, mergedOptions.maxExamplesPerFunction)
  const examples = fn.jsdoc.examples.slice(0, exampleCount)

  const sections: string[] = []

  if (mergedOptions.includeTitle) {
    sections.push(`### ${fn.name}`)
    sections.push('')
  }

  for (const [index, example] of examples.entries()) {
    const formattedExample = formatCodeBlock(example, mergedOptions.defaultLanguage)

    if (mergedOptions.collapsible && examples.length > 1) {
      sections.push(`<details>`)
      sections.push(`<summary>Example ${index + 1}</summary>`)
      sections.push('')
      sections.push(formattedExample)
      sections.push('')
      sections.push(`</details>`)
    } else {
      sections.push(formattedExample)
    }

    if (index < examples.length - 1) {
      sections.push('')
    }
  }

  return sections.join('\n')
}

export function formatTypeExamples(type: ExportedType, options: CodeExampleOptions = {}): string {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options}

  if (type.jsdoc?.examples === undefined || type.jsdoc.examples.length === 0) {
    return ''
  }

  const exampleCount = Math.min(type.jsdoc.examples.length, mergedOptions.maxExamplesPerFunction)
  const examples = type.jsdoc.examples.slice(0, exampleCount)

  const sections: string[] = []

  if (mergedOptions.includeTitle) {
    sections.push(`### ${type.name}`)
    sections.push('')
  }

  for (const [index, example] of examples.entries()) {
    const formattedExample = formatCodeBlock(example, mergedOptions.defaultLanguage)

    if (mergedOptions.collapsible && examples.length > 1) {
      sections.push(`<details>`)
      sections.push(`<summary>Example ${index + 1}</summary>`)
      sections.push('')
      sections.push(formattedExample)
      sections.push('')
      sections.push(`</details>`)
    } else {
      sections.push(formattedExample)
    }

    if (index < examples.length - 1) {
      sections.push('')
    }
  }

  return sections.join('\n')
}

export function formatCodeBlock(code: string, language = 'typescript'): string {
  const cleanedCode = cleanCodeExample(code)
  const detectedLanguage = detectLanguage(cleanedCode) ?? language

  return `\`\`\`${detectedLanguage}\n${cleanedCode}\n\`\`\``
}

export function cleanCodeExample(code: string): string {
  let cleaned = code.trim()

  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n')
    lines.shift()
    if (lines.at(-1)?.trim() === '```') {
      lines.pop()
    }
    cleaned = lines.join('\n')
  }

  cleaned = cleaned
    .split('\n')
    .map(line => {
      if (line.startsWith(' * ')) {
        return line.slice(3)
      }
      if (line.startsWith('* ')) {
        return line.slice(2)
      }
      return line
    })
    .join('\n')

  const lines = cleaned.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)

  if (nonEmptyLines.length === 0) {
    return cleaned
  }

  const minIndent = Math.min(
    ...nonEmptyLines.map(line => {
      const match = /^(\s*)/.exec(line)
      return match?.[1]?.length ?? 0
    }),
  )

  if (minIndent > 0) {
    cleaned = lines.map(line => line.slice(minIndent)).join('\n')
  }

  return cleaned.trim()
}

export function detectLanguage(code: string): string | undefined {
  if (code.includes('import ') || code.includes('export ') || code.includes(': ')) {
    if (code.includes('<') && code.includes('/>')) {
      return 'tsx'
    }
    return 'typescript'
  }

  if (code.includes('const ') || code.includes('let ') || code.includes('function ')) {
    if (code.includes('<') && code.includes('/>')) {
      return 'jsx'
    }
    return 'javascript'
  }

  if (code.startsWith('{') || code.startsWith('[')) {
    return 'json'
  }

  if (code.includes('$ ') || code.includes('npm ') || code.includes('pnpm ')) {
    return 'bash'
  }

  return undefined
}

export function formatUsageExample(fn: ExportedFunction): string {
  const params = fn.parameters.map(p => {
    if (p.optional && p.defaultValue !== undefined) {
      return `${p.name} = ${p.defaultValue}`
    }
    if (p.optional) {
      return `${p.name}?`
    }
    return p.name
  })

  const call = `${fn.name}(${params.join(', ')})`

  if (fn.isAsync) {
    return `const result = await ${call}`
  }

  if (fn.returnType !== 'void') {
    return `const result = ${call}`
  }

  return call
}

export function groupExamplesByCategory(
  api: PackageAPI,
): Map<string, {functions: ExportedFunction[]; types: ExportedType[]}> {
  const categories = new Map<string, {functions: ExportedFunction[]; types: ExportedType[]}>()

  for (const fn of api.functions) {
    if (fn.jsdoc?.examples === undefined || fn.jsdoc.examples.length === 0) {
      continue
    }

    const category = inferCategory(fn.name)
    const existing = categories.get(category) ?? {functions: [], types: []}
    existing.functions.push(fn)
    categories.set(category, existing)
  }

  for (const type of api.types) {
    if (type.jsdoc?.examples === undefined || type.jsdoc.examples.length === 0) {
      continue
    }

    const category = inferCategory(type.name)
    const existing = categories.get(category) ?? {functions: [], types: []}
    existing.types.push(type)
    categories.set(category, existing)
  }

  return categories
}

function inferCategory(name: string): string {
  const prefixes = ['create', 'get', 'set', 'is', 'has', 'parse', 'format', 'validate', 'build']

  for (const prefix of prefixes) {
    if (name.toLowerCase().startsWith(prefix)) {
      return capitalizeFirst(prefix)
    }
  }

  return 'General'
}

function capitalizeFirst(str: string): string {
  if (str.length === 0) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatGroupedExamples(api: PackageAPI, options: CodeExampleOptions = {}): string {
  const categories = groupExamplesByCategory(api)
  const sections: string[] = []

  for (const [category, items] of categories) {
    sections.push(`### ${category}`)
    sections.push('')

    for (const fn of items.functions) {
      const examples = formatFunctionExamples(fn, {...options, includeTitle: false})
      if (examples.length > 0) {
        sections.push(`#### \`${fn.name}\``)
        sections.push('')
        sections.push(examples)
        sections.push('')
      }
    }

    for (const type of items.types) {
      const examples = formatTypeExamples(type, {...options, includeTitle: false})
      if (examples.length > 0) {
        sections.push(`#### \`${type.name}\``)
        sections.push('')
        sections.push(examples)
        sections.push('')
      }
    }
  }

  return sections.join('\n').trim()
}
