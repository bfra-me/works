/**
 * @bfra.me/doc-sync/generators/api-reference-generator - API documentation table generation
 */

import type {ExportedFunction, ExportedType, PackageAPI} from '../types'

export function generateAPIReference(api: PackageAPI): string {
  const sections: string[] = []

  if (api.functions.length > 0) {
    sections.push('### Functions')
    sections.push('')
    sections.push(generateFunctionsTable(api.functions))
    sections.push('')
    sections.push(generateFunctionDetails(api.functions))
  }

  if (api.types.length > 0) {
    sections.push('### Types')
    sections.push('')
    sections.push(generateTypesTable(api.types))
    sections.push('')
    sections.push(generateTypeDetails(api.types))
  }

  return sections.join('\n')
}

function generateFunctionsTable(functions: readonly ExportedFunction[]): string {
  const lines: string[] = []

  lines.push('| Function | Description |')
  lines.push('| -------- | ----------- |')

  for (const fn of functions) {
    const name = formatFunctionName(fn)
    const description = fn.jsdoc?.description ?? ''
    const firstLine = getFirstLine(description)
    lines.push(`| ${name} | ${escapeTableCell(firstLine)} |`)
  }

  return lines.join('\n')
}

function generateFunctionDetails(functions: readonly ExportedFunction[]): string {
  const sections: string[] = []

  for (const fn of functions) {
    sections.push(generateFunctionDetail(fn))
  }

  return sections.join('\n\n')
}

function generateFunctionDetail(fn: ExportedFunction): string {
  const lines: string[] = []

  lines.push(`#### \`${fn.name}\``)
  lines.push('')

  if (fn.jsdoc?.description !== undefined) {
    lines.push(fn.jsdoc.description)
    lines.push('')
  }

  lines.push('```typescript')
  lines.push(fn.signature)
  lines.push('```')

  if (fn.parameters.length > 0) {
    lines.push('')
    lines.push('**Parameters:**')
    lines.push('')
    lines.push('| Name | Type | Description |')
    lines.push('| ---- | ---- | ----------- |')

    for (const param of fn.parameters) {
      const paramDoc = fn.jsdoc?.params?.find(p => p.name === param.name)
      const description = paramDoc?.description ?? ''
      const optional = param.optional ? ' (optional)' : ''
      lines.push(
        `| \`${param.name}\`${optional} | \`${escapeCode(param.type)}\` | ${escapeTableCell(description)} |`,
      )
    }
  }

  if (fn.returnType !== 'void') {
    lines.push('')
    lines.push(`**Returns:** \`${escapeCode(fn.returnType)}\``)

    if (fn.jsdoc?.returns !== undefined) {
      lines.push('')
      lines.push(fn.jsdoc.returns)
    }
  }

  if (fn.jsdoc?.deprecated !== undefined) {
    lines.push('')
    lines.push(`:::caution[Deprecated]`)
    lines.push(fn.jsdoc.deprecated)
    lines.push(':::')
  }

  if (fn.jsdoc?.since !== undefined) {
    lines.push('')
    lines.push(`*Since: ${fn.jsdoc.since}*`)
  }

  return lines.join('\n')
}

function generateTypesTable(types: readonly ExportedType[]): string {
  const lines: string[] = []

  lines.push('| Type | Kind | Description |')
  lines.push('| ---- | ---- | ----------- |')

  for (const type of types) {
    const name = `[\`${type.name}\`](#${type.name.toLowerCase()})`
    const kind = type.kind
    const description = type.jsdoc?.description ?? ''
    const firstLine = getFirstLine(description)
    lines.push(`| ${name} | ${kind} | ${escapeTableCell(firstLine)} |`)
  }

  return lines.join('\n')
}

function generateTypeDetails(types: readonly ExportedType[]): string {
  const sections: string[] = []

  for (const type of types) {
    sections.push(generateTypeDetail(type))
  }

  return sections.join('\n\n')
}

function generateTypeDetail(type: ExportedType): string {
  const lines: string[] = []

  lines.push(`#### \`${type.name}\``)
  lines.push('')

  if (type.jsdoc?.description !== undefined) {
    lines.push(type.jsdoc.description)
    lines.push('')
  }

  lines.push('```typescript')
  lines.push(type.definition)
  lines.push('```')

  if (type.typeParameters !== undefined && type.typeParameters.length > 0) {
    lines.push('')
    lines.push(`**Type Parameters:** ${type.typeParameters.map(t => `\`${t}\``).join(', ')}`)
  }

  if (type.jsdoc?.deprecated !== undefined) {
    lines.push('')
    lines.push(`:::caution[Deprecated]`)
    lines.push(type.jsdoc.deprecated)
    lines.push(':::')
  }

  if (type.jsdoc?.since !== undefined) {
    lines.push('')
    lines.push(`*Since: ${type.jsdoc.since}*`)
  }

  return lines.join('\n')
}

function formatFunctionName(fn: ExportedFunction): string {
  const name = `[\`${fn.name}\`](#${fn.name.toLowerCase()})`
  const badges: string[] = []

  if (fn.isAsync) {
    badges.push('<Badge text="async" variant="note" size="small" />')
  }

  if (fn.isGenerator) {
    badges.push('<Badge text="generator" variant="tip" size="small" />')
  }

  if (fn.isDefault) {
    badges.push('<Badge text="default" variant="caution" size="small" />')
  }

  return badges.length > 0 ? `${name} ${badges.join(' ')}` : name
}

function getFirstLine(text: string): string {
  const firstLine = text.split('\n')[0]?.trim() ?? ''

  if (firstLine.length > 100) {
    const truncated = firstLine.slice(0, 97)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 50) {
      return `${truncated.slice(0, lastSpace)}...`
    }
    return `${truncated}...`
  }

  return firstLine
}

function escapeTableCell(content: string): string {
  return content.replaceAll('|', String.raw`\|`).replaceAll('\n', ' ')
}

function escapeCode(code: string): string {
  return code.replaceAll('`', '\\`')
}

export function generateAPICompact(api: PackageAPI): string {
  const lines: string[] = []

  if (api.functions.length > 0) {
    lines.push('**Functions:**')
    for (const fn of api.functions) {
      lines.push(`- \`${fn.name}(${formatParameterList(fn)})\` → \`${fn.returnType}\``)
    }
  }

  if (api.types.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('**Types:**')
    for (const type of api.types) {
      lines.push(`- \`${type.name}\` (${type.kind})`)
    }
  }

  return lines.join('\n')
}

function formatParameterList(fn: ExportedFunction): string {
  return fn.parameters.map(p => (p.optional ? `${p.name}?` : p.name)).join(', ')
}

export function generateCategoryReference(
  functions: readonly ExportedFunction[],
  types: readonly ExportedType[],
  categoryName: string,
): string {
  const sections: string[] = []

  sections.push(`### ${categoryName}`)
  sections.push('')

  if (functions.length > 0) {
    sections.push('#### Functions')
    sections.push('')
    sections.push(generateFunctionsTable(functions))
    sections.push('')
    sections.push(generateFunctionDetails(functions))
  }

  if (types.length > 0) {
    sections.push('#### Types')
    sections.push('')
    sections.push(generateTypesTable(types))
    sections.push('')
    sections.push(generateTypeDetails(types))
  }

  return sections.join('\n')
}
