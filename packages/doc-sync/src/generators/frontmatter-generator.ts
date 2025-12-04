/**
 * @bfra.me/doc-sync/generators/frontmatter-generator - Starlight-compatible frontmatter generation
 */

import type {MDXFrontmatter, PackageInfo, ReadmeContent} from '../types'

/**
 * Mutable frontmatter for internal construction before freezing
 */
interface MutableFrontmatter {
  title: string
  description?: string
  sidebar?: MDXFrontmatter['sidebar']
  tableOfContents?: MDXFrontmatter['tableOfContents']
  template?: MDXFrontmatter['template']
  hero?: MDXFrontmatter['hero']
}

export function generateFrontmatter(
  packageInfo: PackageInfo,
  readme: ReadmeContent | undefined,
  overrides?: Partial<MDXFrontmatter>,
): MDXFrontmatter {
  const title = resolveTitle(packageInfo, readme, overrides?.title)
  const description = resolveDescription(packageInfo, readme, overrides?.description)

  const frontmatter: MutableFrontmatter = {
    title,
    ...(description !== undefined && {description}),
    ...(overrides?.sidebar !== undefined && {sidebar: overrides.sidebar}),
    ...(overrides?.tableOfContents !== undefined && {tableOfContents: overrides.tableOfContents}),
    ...(overrides?.template !== undefined && {template: overrides.template}),
    ...(overrides?.hero !== undefined && {hero: overrides.hero}),
  }

  if (packageInfo.docsConfig?.sidebar !== undefined) {
    frontmatter.sidebar = {
      ...packageInfo.docsConfig.sidebar,
      ...frontmatter.sidebar,
    }
  }

  if (packageInfo.docsConfig?.frontmatter !== undefined) {
    const customFrontmatter = packageInfo.docsConfig.frontmatter
    return {...customFrontmatter, ...frontmatter} as MDXFrontmatter
  }

  return frontmatter as MDXFrontmatter
}

function resolveTitle(
  packageInfo: PackageInfo,
  readme: ReadmeContent | undefined,
  override?: string,
): string {
  if (override !== undefined) {
    return override
  }

  if (packageInfo.docsConfig?.title !== undefined) {
    return packageInfo.docsConfig.title
  }

  if (readme?.title !== undefined) {
    return readme.title
  }

  return packageInfo.name
}

function resolveDescription(
  packageInfo: PackageInfo,
  readme: ReadmeContent | undefined,
  override?: string,
): string | undefined {
  if (override !== undefined) {
    return override
  }

  if (packageInfo.docsConfig?.description !== undefined) {
    return packageInfo.docsConfig.description
  }

  if (packageInfo.description !== undefined) {
    return packageInfo.description
  }

  if (readme?.preamble !== undefined) {
    return extractFirstSentence(readme.preamble)
  }

  return undefined
}

function extractFirstSentence(text: string): string {
  const cleaned = text.trim().replaceAll(/\s+/g, ' ')

  const sentenceEnd = cleaned.search(/[.!?](?:\s|$)/)
  if (sentenceEnd > 0) {
    return cleaned.slice(0, sentenceEnd + 1)
  }

  if (cleaned.length > 160) {
    const truncated = cleaned.slice(0, 157)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 100) {
      return `${truncated.slice(0, lastSpace)}...`
    }
    return `${truncated}...`
  }

  return cleaned
}

export function stringifyFrontmatter(frontmatter: MDXFrontmatter): string {
  const lines: string[] = []

  lines.push(`title: ${yamlString(frontmatter.title)}`)

  if (frontmatter.description !== undefined) {
    lines.push(`description: ${yamlString(frontmatter.description)}`)
  }

  if (frontmatter.sidebar !== undefined) {
    lines.push('sidebar:')
    const sidebar = frontmatter.sidebar

    if (sidebar.label !== undefined) {
      lines.push(`  label: ${yamlString(sidebar.label)}`)
    }

    if (sidebar.order !== undefined) {
      lines.push(`  order: ${sidebar.order}`)
    }

    if (sidebar.hidden !== undefined) {
      lines.push(`  hidden: ${sidebar.hidden}`)
    }

    if (sidebar.badge !== undefined) {
      if (typeof sidebar.badge === 'string') {
        lines.push(`  badge: ${yamlString(sidebar.badge)}`)
      } else {
        lines.push('  badge:')
        lines.push(`    text: ${yamlString(sidebar.badge.text)}`)
        if (sidebar.badge.variant !== undefined) {
          lines.push(`    variant: ${sidebar.badge.variant}`)
        }
      }
    }
  }

  if (frontmatter.tableOfContents !== undefined) {
    if (typeof frontmatter.tableOfContents === 'boolean') {
      lines.push(`tableOfContents: ${frontmatter.tableOfContents}`)
    } else {
      lines.push('tableOfContents:')
      if (frontmatter.tableOfContents.minHeadingLevel !== undefined) {
        lines.push(`  minHeadingLevel: ${frontmatter.tableOfContents.minHeadingLevel}`)
      }
      if (frontmatter.tableOfContents.maxHeadingLevel !== undefined) {
        lines.push(`  maxHeadingLevel: ${frontmatter.tableOfContents.maxHeadingLevel}`)
      }
    }
  }

  if (frontmatter.template !== undefined) {
    lines.push(`template: ${frontmatter.template}`)
  }

  if (frontmatter.hero !== undefined) {
    lines.push('hero:')
    const hero = frontmatter.hero

    if (hero.title !== undefined) {
      lines.push(`  title: ${yamlString(hero.title)}`)
    }

    if (hero.tagline !== undefined) {
      lines.push(`  tagline: ${yamlString(hero.tagline)}`)
    }

    if (hero.image !== undefined) {
      lines.push('  image:')
      lines.push(`    src: ${yamlString(hero.image.src)}`)
      lines.push(`    alt: ${yamlString(hero.image.alt)}`)
    }

    if (hero.actions !== undefined && hero.actions.length > 0) {
      lines.push('  actions:')
      for (const action of hero.actions) {
        lines.push(`    - text: ${yamlString(action.text)}`)
        lines.push(`      link: ${yamlString(action.link)}`)
        if (action.icon !== undefined) {
          lines.push(`      icon: ${yamlString(action.icon)}`)
        }
        if (action.variant !== undefined) {
          lines.push(`      variant: ${action.variant}`)
        }
      }
    }
  }

  return lines.join('\n')
}

function yamlString(value: string): string {
  if (needsQuoting(value)) {
    return `'${value.replaceAll("'", "''")}'`
  }
  return value
}

function needsQuoting(value: string): boolean {
  if (value.length === 0) {
    return true
  }

  if (value.startsWith(' ') || value.endsWith(' ')) {
    return true
  }

  const specialChars = /[:#{}[\]&*?|<>=!%@`"',]/
  if (specialChars.test(value)) {
    return true
  }

  const reserved = ['true', 'false', 'null', 'yes', 'no', 'on', 'off']
  if (reserved.includes(value.toLowerCase())) {
    return true
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return true
  }

  return false
}

/**
 * Mutable frontmatter for internal parsing
 */
interface MutableParsedFrontmatter {
  title?: string
  description?: string
}

export function parseFrontmatter(yaml: string): Partial<MDXFrontmatter> {
  const result: MutableParsedFrontmatter = {}
  const lines = yaml.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('title:')) {
      const value = trimmedLine.slice(6).trim()
      result.title = stripQuotes(value)
    }

    if (trimmedLine.startsWith('description:')) {
      const value = trimmedLine.slice(12).trim()
      result.description = stripQuotes(value)
    }
  }

  return result as Partial<MDXFrontmatter>
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1)
  }
  return value
}
