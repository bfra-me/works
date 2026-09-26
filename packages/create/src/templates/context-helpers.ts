import type {TemplateContext} from '../types.js'

/**
 * Convert a string to kebab-case.
 */
export function kebabCase(str: string): string {
  return str
    .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
    .replaceAll(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert a string to camelCase.
 */
export function camelCase(str: string): string {
  return str
    .replaceAll(/^\w|[A-Z]|\b\w/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replaceAll(/\s+/g, '')
}

/**
 * Convert a string to PascalCase.
 */
export function pascalCase(str: string): string {
  return str.replaceAll(/^\w|[A-Z]|\b\w/g, word => word.toUpperCase()).replaceAll(/\s+/g, '')
}

/**
 * Convert a string to snake_case.
 */
export function snakeCase(str: string): string {
  return str
    .replaceAll(/([a-z])([A-Z])/g, '$1_$2')
    .replaceAll(/[\s-]+/g, '_')
    .toLowerCase()
}

export interface TemplateContextInput {
  projectName: string
  description: string
  author: string
  version: string
  packageManager?: TemplateContext['packageManager']
}

/**
 * Build the TemplateContext used to render a template, including the
 * case-conversion helpers and current year/date exposed to Eta templates.
 * Shared by createPackage() and the built-in template rendering tests so
 * both use the exact same context shape.
 */
export function buildTemplateContext(input: TemplateContextInput): TemplateContext {
  const {projectName, description, author, version, packageManager} = input

  return {
    projectName,
    description,
    author,
    version,
    packageManager,
    variables: {
      name: projectName,
      description,
      author,
      version,
      year: new Date().getFullYear(),
      date: new Date().toISOString().split('T')[0],
      kebabCase,
      camelCase,
      pascalCase,
      snakeCase,
    },
  }
}
