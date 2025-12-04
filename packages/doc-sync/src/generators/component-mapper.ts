/**
 * @bfra.me/doc-sync/generators/component-mapper - Map content sections to Starlight components
 */

import type {PackageInfo, ReadmeContent, ReadmeSection} from '../types'

/**
 * Configuration for Starlight component mapping
 */
export interface ComponentMapperConfig {
  /** Section titles that should use CardGrid for features */
  readonly featureSections?: readonly string[]
  /** Section titles that should use Tabs for installation */
  readonly tabSections?: readonly string[]
  /** Section titles to exclude from output */
  readonly excludeSections?: readonly string[]
  /** Custom component mappings by section title */
  readonly customMappings?: Record<string, SectionMapper>
}

/**
 * A function that maps section content to MDX output
 */
export type SectionMapper = (section: ReadmeSection, info: PackageInfo) => string

/**
 * Default configuration for component mapping
 */
const DEFAULT_CONFIG: Required<Omit<ComponentMapperConfig, 'customMappings'>> = {
  featureSections: ['features', 'highlights', 'key features'],
  tabSections: ['installation', 'getting started', 'setup'],
  excludeSections: ['license', 'contributing', 'contributors', 'changelog'],
}

export function mapToStarlightComponents(
  readme: ReadmeContent,
  packageInfo: PackageInfo,
  config: ComponentMapperConfig = {},
): string {
  const mergedConfig = {...DEFAULT_CONFIG, ...config}
  const sections: string[] = []

  if (readme.preamble !== undefined && readme.preamble.trim().length > 0) {
    sections.push(readme.preamble)
    sections.push('')
  }

  for (const section of readme.sections) {
    const output = mapSection(section, packageInfo, mergedConfig)
    if (output.length > 0) {
      sections.push(output)
      sections.push('')
    }
  }

  return sections.join('\n').trim()
}

function mapSection(
  section: ReadmeSection,
  packageInfo: PackageInfo,
  config: Required<Omit<ComponentMapperConfig, 'customMappings'>> &
    Pick<ComponentMapperConfig, 'customMappings'>,
): string {
  const normalizedHeading = section.heading.toLowerCase().trim()

  if (isExcludedSection(normalizedHeading, config.excludeSections, packageInfo)) {
    return ''
  }

  if (config.customMappings?.[normalizedHeading] !== undefined) {
    return config.customMappings[normalizedHeading](section, packageInfo)
  }

  if (isFeatureSection(normalizedHeading, config.featureSections)) {
    return mapFeatureSection(section)
  }

  if (isInstallationSection(normalizedHeading, config.tabSections)) {
    return mapInstallationSection(section, packageInfo)
  }

  return mapDefaultSection(section, config)
}

function isExcludedSection(
  heading: string,
  excludeSections: readonly string[],
  packageInfo: PackageInfo,
): boolean {
  if (excludeSections.some(excluded => heading.includes(excluded.toLowerCase()))) {
    return true
  }

  if (packageInfo.docsConfig?.excludeSections !== undefined) {
    return packageInfo.docsConfig.excludeSections.some(excluded =>
      heading.includes(excluded.toLowerCase()),
    )
  }

  return false
}

function isFeatureSection(heading: string, featureSections: readonly string[]): boolean {
  return featureSections.some(feature => heading.includes(feature.toLowerCase()))
}

function isInstallationSection(heading: string, tabSections: readonly string[]): boolean {
  return tabSections.some(tab => heading.includes(tab.toLowerCase()))
}

function mapFeatureSection(section: ReadmeSection): string {
  const lines: string[] = []

  lines.push(`## ${section.heading}`)
  lines.push('')

  const features = extractFeatureItems(section.content)

  if (features.length > 0) {
    lines.push('<CardGrid>')
    for (const feature of features) {
      const icon = inferFeatureIcon(feature.title)
      lines.push(`  <Card title="${escapeAttribute(feature.title)}" icon="${icon}">`)
      lines.push(`    ${feature.description}`)
      lines.push('  </Card>')
    }
    lines.push('</CardGrid>')
  } else {
    lines.push(section.content)
  }

  return lines.join('\n')
}

interface FeatureItem {
  readonly title: string
  readonly description: string
}

function extractFeatureItems(content: string): FeatureItem[] {
  const features: FeatureItem[] = []

  const listItemPattern = /^[-*]\s+\*\*([^*]+)\*\*[:\s-](.+)$/gm

  for (const match of content.matchAll(listItemPattern)) {
    if (match[1] !== undefined && match[2] !== undefined) {
      features.push({
        title: match[1].trim(),
        description: match[2].trim(),
      })
    }
  }

  if (features.length === 0) {
    const boldPattern = /\*\*([^*]+)\*\*/g
    const boldMatches = [...content.matchAll(boldPattern)]

    for (const match of boldMatches) {
      if (match[1] !== undefined) {
        const title = match[1].trim()
        const afterMatch = content.slice((match.index ?? 0) + match[0].length)
        const description = afterMatch.split(/\n\n|\*\*/)[0]?.trim() ?? ''

        if (description.length > 0 && description.length < 200) {
          features.push({title, description})
        }
      }
    }
  }

  return features
}

function inferFeatureIcon(title: string): string {
  const lowerTitle = title.toLowerCase()

  const iconMap: Record<string, string> = {
    typescript: 'approve-check',
    type: 'approve-check',
    test: 'approve-check',
    fast: 'rocket',
    speed: 'rocket',
    performance: 'rocket',
    tree: 'seti:plan',
    modular: 'puzzle',
    plugin: 'puzzle',
    extensible: 'puzzle',
    document: 'document',
    doc: 'document',
    config: 'setting',
    setting: 'setting',
    star: 'star',
    feature: 'star',
    safe: 'approve-check',
    secure: 'approve-check',
    error: 'warning',
    async: 'rocket',
    result: 'approve-check',
    function: 'puzzle',
  }

  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowerTitle.includes(keyword)) {
      return icon
    }
  }

  return 'star'
}

function mapInstallationSection(section: ReadmeSection, packageInfo: PackageInfo): string {
  const lines: string[] = []

  lines.push(`## ${section.heading}`)
  lines.push('')

  const hasExistingTabs = section.content.includes('```bash')
  const hasMultiplePackageManagers =
    section.content.includes('pnpm') ||
    section.content.includes('npm') ||
    section.content.includes('yarn')

  if (hasExistingTabs && hasMultiplePackageManagers) {
    lines.push(section.content)
  } else {
    lines.push(generateInstallTabs(packageInfo.name))

    const contentWithoutInstall = removeInstallCommand(section.content)
    if (contentWithoutInstall.trim().length > 0) {
      lines.push('')
      lines.push(contentWithoutInstall)
    }
  }

  return lines.join('\n')
}

export function generateInstallTabs(packageName: string): string {
  return `<Tabs>
  <TabItem label="pnpm">
    \`\`\`bash
    pnpm add ${packageName}
    \`\`\`
  </TabItem>
  <TabItem label="npm">
    \`\`\`bash
    npm install ${packageName}
    \`\`\`
  </TabItem>
  <TabItem label="yarn">
    \`\`\`bash
    yarn add ${packageName}
    \`\`\`
  </TabItem>
</Tabs>`
}

function removeInstallCommand(content: string): string {
  return content
    .replaceAll(/```(?:bash|sh)\n(?:npm|pnpm|yarn)\s+(?:install|add|i)\s+\S+\n```/g, '')
    .trim()
}

function mapDefaultSection(
  section: ReadmeSection,
  config: Required<Omit<ComponentMapperConfig, 'customMappings'>> &
    Pick<ComponentMapperConfig, 'customMappings'>,
): string {
  const lines: string[] = []

  const headingLevel = '#'.repeat(Math.min(section.level + 1, 6))
  lines.push(`${headingLevel} ${section.heading}`)
  lines.push('')
  lines.push(section.content)

  for (const child of section.children) {
    const childOutput = mapSection(child, {} as PackageInfo, config)
    if (childOutput.length > 0) {
      lines.push('')
      lines.push(childOutput)
    }
  }

  return lines.join('\n')
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function createBadge(
  text: string,
  variant: 'note' | 'tip' | 'caution' | 'danger' | 'success' | 'default' = 'note',
): string {
  return `<Badge text="${escapeAttribute(text)}" variant="${variant}" />`
}

export function createCard(title: string, content: string, icon?: string): string {
  const iconAttr = icon === undefined ? '' : ` icon="${icon}"`
  return `<Card title="${escapeAttribute(title)}"${iconAttr}>
  ${content}
</Card>`
}

export function createCardGrid(cards: {title: string; content: string; icon?: string}[]): string {
  const cardElements = cards.map(card => createCard(card.title, card.content, card.icon))
  return `<CardGrid>
${cardElements.map(c => `  ${c}`).join('\n')}
</CardGrid>`
}

export function createTabs(items: {label: string; content: string}[]): string {
  const tabItems = items.map(
    item => `  <TabItem label="${escapeAttribute(item.label)}">
    ${item.content}
  </TabItem>`,
  )

  return `<Tabs>
${tabItems.join('\n')}
</Tabs>`
}
