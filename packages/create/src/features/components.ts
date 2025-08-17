import type {FeatureAddContext} from '../types.js'
import {existsSync, mkdirSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import path from 'node:path'
import {consola} from 'consola'

/**
 * Add a component to a project
 */
export async function addComponentFeature(
  featureName: string,
  context: FeatureAddContext,
): Promise<void> {
  const {targetDir, projectInfo, verbose, dryRun, options} = context

  if (verbose) {
    consola.info(`Adding ${featureName}...`)
  }

  // Extract options
  const componentName = options?.name as string
  const componentPath = (options?.path as string) ?? 'components'
  const withTest = (options?.withTest as boolean) ?? true
  const withStory = (options?.withStory as boolean) ?? false

  if (!componentName) {
    throw new Error('Component name is required. Use --name option to specify the component name.')
  }

  // Validate component name
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
    throw new Error('Component name must be PascalCase (e.g., MyComponent)')
  }

  // Generate component based on project type
  switch (featureName) {
    case 'react-component':
      await generateReactComponent(
        targetDir,
        componentName,
        componentPath,
        projectInfo.type,
        withTest,
        withStory,
        dryRun,
        verbose,
      )
      break
    case 'vue-component':
      await generateVueComponent(
        targetDir,
        componentName,
        componentPath,
        projectInfo.type,
        withTest,
        dryRun,
        verbose,
      )
      break
    default:
      throw new Error(`Unsupported component type: ${featureName}`)
  }
}

/**
 * Generate a React component
 */
async function generateReactComponent(
  targetDir: string,
  componentName: string,
  componentPath: string,
  projectType: string,
  withTest: boolean,
  withStory: boolean,
  dryRun?: boolean,
  verbose?: boolean,
): Promise<void> {
  const isTypeScript = projectType === 'typescript' || projectType === 'react'
  const componentDir = path.join(targetDir, 'src', componentPath)
  const componentFile = `${componentName}.${isTypeScript ? 'tsx' : 'jsx'}`
  const componentFilePath = path.join(componentDir, componentFile)

  // Create component directory
  if (!existsSync(componentDir)) {
    if (dryRun === false || dryRun === undefined) {
      mkdirSync(componentDir, {recursive: true})
    } else {
      consola.info(`Would create directory: ${componentPath}`)
    }
  }

  // Generate component content
  const componentContent = generateReactComponentContent(componentName, isTypeScript)

  if (dryRun === false || dryRun === undefined) {
    await writeFile(componentFilePath, componentContent, 'utf-8')
    if (verbose) {
      consola.success(`Created React component: ${componentFile}`)
    }
  } else {
    consola.info(`Would create React component: ${componentFile}`)
  }

  // Generate test file if requested
  if (withTest) {
    const testFile = `${componentName}.test.${isTypeScript ? 'tsx' : 'jsx'}`
    const testFilePath = path.join(componentDir, testFile)
    const testContent = generateReactTestContent(componentName, isTypeScript)

    if (dryRun === false || dryRun === undefined) {
      await writeFile(testFilePath, testContent, 'utf-8')
      if (verbose) {
        consola.success(`Created test file: ${testFile}`)
      }
    } else {
      consola.info(`Would create test file: ${testFile}`)
    }
  }

  // Generate Storybook story if requested
  if (withStory) {
    const storyFile = `${componentName}.stories.${isTypeScript ? 'tsx' : 'jsx'}`
    const storyFilePath = path.join(componentDir, storyFile)
    const storyContent = generateReactStoryContent(componentName, isTypeScript)

    if (dryRun === false || dryRun === undefined) {
      await writeFile(storyFilePath, storyContent, 'utf-8')
      if (verbose) {
        consola.success(`Created story file: ${storyFile}`)
      }
    } else {
      consola.info(`Would create story file: ${storyFile}`)
    }
  }

  // Generate index file for easy imports
  const indexFile = `index.${isTypeScript ? 'ts' : 'js'}`
  const indexFilePath = path.join(componentDir, indexFile)
  const indexContent = `export { default } from './${componentName}'\n`

  if (dryRun === false || dryRun === undefined) {
    await writeFile(indexFilePath, indexContent, 'utf-8')
    if (verbose) {
      consola.success(`Created index file: ${indexFile}`)
    }
  } else {
    consola.info(`Would create index file: ${indexFile}`)
  }
}

/**
 * Generate a Vue component
 */
async function generateVueComponent(
  targetDir: string,
  componentName: string,
  componentPath: string,
  projectType: string,
  withTest: boolean,
  dryRun?: boolean,
  verbose?: boolean,
): Promise<void> {
  const isTypeScript = projectType === 'typescript'
  const componentDir = path.join(targetDir, 'src', componentPath)
  const componentFile = `${componentName}.vue`
  const componentFilePath = path.join(componentDir, componentFile)

  // Create component directory
  if (!existsSync(componentDir)) {
    if (dryRun === false || dryRun === undefined) {
      mkdirSync(componentDir, {recursive: true})
    } else {
      consola.info(`Would create directory: ${componentPath}`)
    }
  }

  // Generate component content
  const componentContent = generateVueComponentContent(componentName, isTypeScript)

  if (dryRun === false || dryRun === undefined) {
    await writeFile(componentFilePath, componentContent, 'utf-8')
    if (verbose) {
      consola.success(`Created Vue component: ${componentFile}`)
    }
  } else {
    consola.info(`Would create Vue component: ${componentFile}`)
  }

  // Generate test file if requested
  if (withTest) {
    const testFile = `${componentName}.test.${isTypeScript ? 'ts' : 'js'}`
    const testFilePath = path.join(componentDir, testFile)
    const testContent = generateVueTestContent(componentName, isTypeScript)

    if (dryRun === false || dryRun === undefined) {
      await writeFile(testFilePath, testContent, 'utf-8')
      if (verbose) {
        consola.success(`Created test file: ${testFile}`)
      }
    } else {
      consola.info(`Would create test file: ${testFile}`)
    }
  }
}

/**
 * Generate React component content
 */
function generateReactComponentContent(componentName: string, isTypeScript: boolean): string {
  if (isTypeScript) {
    return `import React from 'react'

export interface ${componentName}Props {
  /** Component children */
  children?: React.ReactNode
  /** Additional CSS class names */
  className?: string
}

/**
 * ${componentName} component
 */
export default function ${componentName}({ children, className }: ${componentName}Props) {
  return (
    <div className={className}>
      <h2>${componentName}</h2>
      {children}
    </div>
  )
}
`
  }

  return `import React from 'react'

/**
 * ${componentName} component
 */
export default function ${componentName}({ children, className }) {
  return (
    <div className={className}>
      <h2>${componentName}</h2>
      {children}
    </div>
  )
}
`
}

/**
 * Generate React test content
 */
function generateReactTestContent(componentName: string, isTypeScript: boolean): string {
  const importExt = isTypeScript ? '' : '.jsx'

  return `import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import ${componentName} from './${componentName}${importExt}'

describe('${componentName}', () => {
  it('renders component name', () => {
    render(<${componentName} />)
    expect(screen.getByText('${componentName}')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <${componentName}>
        <span>Test content</span>
      </${componentName}>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<${componentName} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
`
}

/**
 * Generate React Storybook story content
 */
function generateReactStoryContent(componentName: string, isTypeScript: boolean): string {
  const importExt = isTypeScript ? '' : '.jsx'

  return `import type { Meta, StoryObj } from '@storybook/react'
import ${componentName} from './${componentName}${importExt}'

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithChildren: Story = {
  args: {
    children: 'This is some content inside the component',
  },
}

export const WithClassName: Story = {
  args: {
    className: 'custom-styling',
  },
}
`
}

/**
 * Generate Vue component content
 */
function generateVueComponentContent(componentName: string, isTypeScript: boolean): string {
  if (isTypeScript) {
    return `<template>
  <div :class="className">
    <h2>${componentName}</h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
export interface ${componentName}Props {
  /** Additional CSS class names */
  className?: string
}

const props = withDefaults(defineProps<${componentName}Props>(), {
  className: '',
})
</script>

<style scoped>
/* Component styles go here */
</style>
`
  }

  return `<template>
  <div :class="className">
    <h2>${componentName}</h2>
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  className: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
/* Component styles go here */
</style>
`
}

/**
 * Generate Vue test content
 */
function generateVueTestContent(componentName: string, _isTypeScript: boolean): string {
  return `import {mount} from '@vue/test-utils'
import {describe, expect, it} from 'vitest'
import ${componentName} from './${componentName}.vue'

describe('${componentName}', () => {
  it('renders component name', () => {
    const wrapper = mount(${componentName})
    expect(wrapper.text()).toContain('${componentName}')
  })

  it('renders slot content', () => {
    const wrapper = mount(${componentName}, {
      slots: {
        default: 'Test content',
      },
    })
    expect(wrapper.text()).toContain('Test content')
  })

  it('applies custom className', () => {
    const wrapper = mount(${componentName}, {
      props: {
        className: 'custom-class',
      },
    })
    expect(wrapper.classes()).toContain('custom-class')
  })
})
`
}
