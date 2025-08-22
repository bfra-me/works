/**
 * Project customization prompts for name, description, author, and options
 */

import type {
  CreateCommandOptions,
  DependencyRecommendation,
  ProjectCustomization,
  TemplateSelection,
} from '../types.js'
import process from 'node:process'
import {cancel, isCancel, multiselect, select, text} from '@clack/prompts'
import {detect} from 'package-manager-detector'

interface CustomizationInput {
  projectName: string
  template: TemplateSelection
  initialOptions: CreateCommandOptions
  aiRecommendations?: DependencyRecommendation[]
}

/**
 * Collect project customization details through interactive prompts
 */
export async function projectCustomization(
  input: CustomizationInput,
): Promise<ProjectCustomization> {
  const {projectName, template, initialOptions, aiRecommendations} = input

  // Show AI dependency recommendations if available
  if (aiRecommendations != null && aiRecommendations.length > 0) {
    const {displayDependencyRecommendations} = await import('../utils/ui.js')
    displayDependencyRecommendations(aiRecommendations)

    // Brief explanation about how AI recommendations will be used
    const {note} = await import('@clack/prompts')
    note(
      '🤖 AI recommendations will be considered when setting up your project dependencies and configuration.',
      'AI-Powered Setup',
    )
  }

  // Project description
  let description = initialOptions.description
  if (description == null || description.trim().length === 0) {
    const descResult = await text({
      message: '📝 Describe your project (optional):',
      placeholder: `A new ${template.metadata.name} project`,
      defaultValue: `A new ${template.metadata.name} project`,
    })

    if (isCancel(descResult)) {
      cancel('Project customization cancelled')
      process.exit(0)
    }

    description = descResult
  }

  // Project author
  let author = initialOptions.author
  if (author == null || author.trim().length === 0) {
    const authorResult = await text({
      message: '👤 Project author (optional):',
      placeholder: 'Your Name <email@example.com>',
    })

    if (isCancel(authorResult)) {
      cancel('Project customization cancelled')
      process.exit(0)
    }

    author = authorResult
  }

  // Project version
  let version = initialOptions.version
  if (version == null || version.trim().length === 0) {
    const versionResult = await text({
      message: '🏷️  Initial version:',
      placeholder: '1.0.0',
      defaultValue: '1.0.0',
      validate: value => {
        if (!value || value.trim().length === 0) {
          return 'Version is required'
        }
        if (!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(value.trim())) {
          return 'Version must follow semver format (e.g., 1.0.0)'
        }
        return undefined
      },
    })

    if (isCancel(versionResult)) {
      cancel('Project customization cancelled')
      process.exit(0)
    }

    version = versionResult
  }

  // Package manager
  let packageManager = initialOptions.packageManager
  if (!packageManager) {
    // Auto-detect current package manager
    const detected = await detect()
    const detectedPm = detected?.name as 'npm' | 'yarn' | 'pnpm' | 'bun' | undefined

    const pmResult = await select({
      message: '📦 Choose package manager:',
      options: [
        {
          value: 'npm',
          label: 'npm',
          hint: detectedPm === 'npm' ? '(detected)' : '',
        },
        {
          value: 'yarn',
          label: 'Yarn',
          hint: detectedPm === 'yarn' ? '(detected)' : '',
        },
        {
          value: 'pnpm',
          label: 'pnpm',
          hint: detectedPm === 'pnpm' ? '(detected)' : '',
        },
        {
          value: 'bun',
          label: 'Bun',
          hint: detectedPm === 'bun' ? '(detected)' : '',
        },
      ],
      initialValue: detectedPm ?? 'npm',
    })

    if (isCancel(pmResult)) {
      cancel('Project customization cancelled')
      process.exit(0)
    }

    packageManager = pmResult
  }

  // Output directory
  let outputDir = initialOptions.outputDir
  if (outputDir == null || outputDir.trim().length === 0) {
    const outputDirResult = await text({
      message: '📁 Output directory:',
      placeholder: `./${projectName}`,
      defaultValue: `./${projectName}`,
      validate: value => {
        if (!value || value.trim().length === 0) {
          return 'Output directory is required'
        }
        return undefined
      },
    })

    if (isCancel(outputDirResult)) {
      cancel('Project customization cancelled')
      process.exit(0)
    }

    outputDir = outputDirResult
  }

  // Optional features (template-specific)
  const features = await selectOptionalFeatures(template, aiRecommendations)

  return {
    description,
    author,
    version,
    packageManager,
    outputDir,
    features,
    variables: {},
  }
}

/**
 * Select optional features based on template
 */
async function selectOptionalFeatures(
  template: TemplateSelection,
  aiRecommendations?: DependencyRecommendation[],
): Promise<string[]> {
  // Define available features per template
  const templateFeatures: Record<string, {value: string; label: string; hint?: string}[]> = {
    default: [
      {value: 'prettier', label: 'Prettier', hint: 'Code formatting'},
      {value: 'eslint', label: 'ESLint', hint: 'Code linting'},
      {value: 'vitest', label: 'Vitest', hint: 'Unit testing'},
      {value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows'},
    ],
    library: [
      {value: 'prettier', label: 'Prettier', hint: 'Code formatting'},
      {value: 'eslint', label: 'ESLint', hint: 'Code linting'},
      {value: 'vitest', label: 'Vitest', hint: 'Unit testing'},
      {value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows'},
      {value: 'semantic-release', label: 'Semantic Release', hint: 'Automated releases'},
      {value: 'docs', label: 'Documentation', hint: 'API documentation setup'},
    ],
    cli: [
      {value: 'prettier', label: 'Prettier', hint: 'Code formatting'},
      {value: 'eslint', label: 'ESLint', hint: 'Code linting'},
      {value: 'vitest', label: 'Vitest', hint: 'Unit testing'},
      {value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows'},
      {value: 'commander', label: 'Commander.js', hint: 'CLI framework'},
    ],
    node: [
      {value: 'prettier', label: 'Prettier', hint: 'Code formatting'},
      {value: 'eslint', label: 'ESLint', hint: 'Code linting'},
      {value: 'vitest', label: 'Vitest', hint: 'Unit testing'},
      {value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows'},
      {value: 'express', label: 'Express.js', hint: 'Web framework'},
      {value: 'cors', label: 'CORS', hint: 'Cross-origin support'},
      {value: 'helmet', label: 'Helmet', hint: 'Security middleware'},
    ],
    react: [
      {value: 'prettier', label: 'Prettier', hint: 'Code formatting'},
      {value: 'eslint', label: 'ESLint', hint: 'Code linting'},
      {value: 'vitest', label: 'Vitest', hint: 'Unit testing'},
      {value: 'github-actions', label: 'GitHub Actions', hint: 'CI/CD workflows'},
      {value: 'router', label: 'React Router', hint: 'Client-side routing'},
      {value: 'styled-components', label: 'Styled Components', hint: 'CSS-in-JS styling'},
      {value: 'storybook', label: 'Storybook', hint: 'Component development'},
    ],
  }

  const availableFeatures =
    templateFeatures[template.metadata.name] ?? templateFeatures.default ?? []

  if (availableFeatures.length === 0) {
    return []
  }

  // Enhance features with AI recommendations
  let enhancedFeatures = [...availableFeatures]

  if (aiRecommendations != null && aiRecommendations.length > 0) {
    // Map AI dependency recommendations to features
    const aiSuggestedFeatures = aiRecommendations
      .filter(dep => dep.confidence >= 0.7) // Only high-confidence recommendations
      .map(dep => {
        // Try to match AI recommendations to available features
        const featureName = dep.name.toLowerCase()
        const matchingFeature = availableFeatures.find(
          f =>
            f.value.includes(featureName) ||
            featureName.includes(f.value) ||
            f.label.toLowerCase().includes(featureName),
        )

        if (matchingFeature) {
          return {
            ...matchingFeature,
            hint: `${matchingFeature.hint} (🤖 AI recommended - ${Math.round(dep.confidence * 100)}%)`,
          }
        }

        // Create new feature entry for unmatched AI recommendations
        return {
          value: dep.name,
          label: dep.name,
          hint: `🤖 AI recommended - ${dep.reason} (${Math.round(dep.confidence * 100)}%)`,
        }
      })
      .filter(
        (feature, index, self) =>
          // Remove duplicates
          self.findIndex(f => f.value === feature.value) === index,
      )

    // Merge AI-suggested features with template features
    enhancedFeatures = availableFeatures.map(feature => {
      const aiEnhanced = aiSuggestedFeatures.find(ai => ai.value === feature.value)
      return aiEnhanced || feature
    })

    // Add unique AI recommendations that don't match existing features
    const uniqueAiFeatures = aiSuggestedFeatures.filter(
      aiFeature => !availableFeatures.some(feature => feature.value === aiFeature.value),
    )

    enhancedFeatures.push(...uniqueAiFeatures)
  }

  const featuresResult = await multiselect({
    message:
      aiRecommendations != null && aiRecommendations.length > 0
        ? '🔧 Select features to include (🤖 = AI recommended):'
        : '🔧 Select optional features to include:',
    options: enhancedFeatures,
    required: false,
  })

  if (isCancel(featuresResult)) {
    cancel('Project customization cancelled')
    process.exit(0)
  }

  return featuresResult
}

/**
 * Validate customization input
 */
export function validateCustomization(customization: ProjectCustomization): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate version format
  if (
    customization.version != null &&
    customization.version.trim().length > 0 &&
    !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(customization.version)
  ) {
    errors.push('Version must follow semver format (e.g., 1.0.0)')
  }

  // Validate package manager
  const validPackageManagers = ['npm', 'yarn', 'pnpm', 'bun']
  if (
    customization.packageManager &&
    !validPackageManagers.includes(customization.packageManager)
  ) {
    errors.push(`Package manager must be one of: ${validPackageManagers.join(', ')}`)
  }

  // Validate output directory
  if (customization.outputDir != null && customization.outputDir.trim().length === 0) {
    errors.push('Output directory cannot be empty')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
