import type {FeatureAddContext, FeatureInfo} from '../types.js'
import {addComponentFeature} from './components.js'
import {addESLintFeature} from './eslint.js'
import {addPrettierFeature} from './prettier.js'
import {addTypeScriptFeature} from './typescript.js'
import {addVitestFeature} from './vitest.js'

/**
 * Registry of available features
 */
const FEATURE_REGISTRY: Record<string, FeatureInfo> = {
  eslint: {
    name: 'eslint',
    description: 'Add ESLint configuration with @bfra.me/eslint-config',
    category: 'linting',
    dependencies: [],
    devDependencies: ['@bfra.me/eslint-config', 'eslint'],
    supportedFrameworks: ['typescript', 'javascript', 'react', 'vue', 'node'],
    files: ['eslint.config.ts', 'eslint.config.js'],
    nextSteps: [
      'Run `npm run lint` to check your code',
      'Configure your editor to show ESLint errors',
      'Add lint script to package.json if not present',
    ],
  },
  prettier: {
    name: 'prettier',
    description: 'Add Prettier configuration with @bfra.me/prettier-config',
    category: 'linting',
    dependencies: [],
    devDependencies: ['@bfra.me/prettier-config', 'prettier'],
    supportedFrameworks: ['typescript', 'javascript', 'react', 'vue', 'node'],
    files: ['.prettierrc', '.prettierrc.json', 'prettier.config.js'],
    nextSteps: [
      'Run `npm run format` to format your code',
      'Configure your editor to format on save',
      'Add format script to package.json if not present',
    ],
  },
  typescript: {
    name: 'typescript',
    description: 'Add TypeScript configuration with @bfra.me/tsconfig',
    category: 'configuration',
    dependencies: [],
    devDependencies: ['@bfra.me/tsconfig', 'typescript'],
    supportedFrameworks: ['javascript', 'node'],
    files: ['tsconfig.json'],
    nextSteps: [
      'Rename .js files to .ts',
      'Add type annotations to your code',
      'Run `npx tsc` to check types',
    ],
  },
  vitest: {
    name: 'vitest',
    description: 'Add Vitest testing setup with configuration and sample tests',
    category: 'testing',
    dependencies: [],
    devDependencies: ['vitest', '@vitest/ui'],
    supportedFrameworks: ['typescript', 'javascript', 'react', 'vue'],
    files: ['vitest.config.ts', 'vitest.config.js', 'test/'],
    nextSteps: [
      'Write your first test in the test/ directory',
      'Run `npm run test` to execute tests',
      'Run `npm run test:ui` for the web interface',
    ],
  },
  'react-component': {
    name: 'react-component',
    description: 'Generate a React component with TypeScript',
    category: 'component',
    dependencies: [],
    devDependencies: [],
    supportedFrameworks: ['react'],
    files: [],
    options: [
      {
        name: 'name',
        description: 'Component name',
        type: 'string',
        required: true,
      },
      {
        name: 'path',
        description: 'Component path (relative to src/)',
        type: 'string',
        default: 'components',
      },
      {
        name: 'withTest',
        description: 'Generate test file',
        type: 'boolean',
        default: true,
      },
      {
        name: 'withStory',
        description: 'Generate Storybook story',
        type: 'boolean',
        default: false,
      },
    ],
    nextSteps: [
      'Import and use your component',
      'Add props and TypeScript interfaces',
      'Write tests for your component',
    ],
  },
  'vue-component': {
    name: 'vue-component',
    description: 'Generate a Vue component with Composition API',
    category: 'component',
    dependencies: [],
    devDependencies: [],
    supportedFrameworks: ['vue'],
    files: [],
    options: [
      {
        name: 'name',
        description: 'Component name',
        type: 'string',
        required: true,
      },
      {
        name: 'path',
        description: 'Component path (relative to src/)',
        type: 'string',
        default: 'components',
      },
      {
        name: 'withTest',
        description: 'Generate test file',
        type: 'boolean',
        default: true,
      },
    ],
    nextSteps: [
      'Import and use your component',
      'Add props and TypeScript interfaces',
      'Write tests for your component',
    ],
  },
}

/**
 * Get all available features
 */
export function getAvailableFeatures(): Record<string, FeatureInfo> {
  return FEATURE_REGISTRY
}

/**
 * Get information about a specific feature
 */
export function getFeatureInfo(featureName: string): FeatureInfo | undefined {
  return FEATURE_REGISTRY[featureName]
}

/**
 * Check if a feature is supported for the given project type
 */
export function isFeatureSupported(featureName: string, projectType: string): boolean {
  const feature = getFeatureInfo(featureName)
  if (!feature) {
    return false
  }

  if (!feature.supportedFrameworks || feature.supportedFrameworks.length === 0) {
    return true // Feature supports all frameworks
  }

  return feature.supportedFrameworks.includes(projectType)
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureInfo['category']): FeatureInfo[] {
  return Object.values(FEATURE_REGISTRY).filter(feature => feature.category === category)
}

/**
 * Add a feature to a project
 */
export async function addFeature(featureName: string, context: FeatureAddContext): Promise<void> {
  const feature = getFeatureInfo(featureName)
  if (!feature) {
    throw new Error(`Unknown feature: ${featureName}`)
  }

  // Check if feature is supported for this project type
  if (!isFeatureSupported(featureName, context.projectInfo.type)) {
    throw new Error(
      `Feature "${featureName}" is not supported for ${context.projectInfo.type} projects. ` +
        `Supported frameworks: ${feature.supportedFrameworks?.join(', ') ?? 'all'}`,
    )
  }

  // Dispatch to appropriate feature handler
  switch (featureName) {
    case 'eslint':
      await addESLintFeature(context)
      break
    case 'prettier':
      await addPrettierFeature(context)
      break
    case 'typescript':
      await addTypeScriptFeature(context)
      break
    case 'vitest':
      await addVitestFeature(context)
      break
    case 'react-component':
    case 'vue-component':
      await addComponentFeature(featureName, context)
      break
    default:
      throw new Error(`Feature "${featureName}" is not yet implemented`)
  }
}

/**
 * Register a new feature in the registry
 */
export function registerFeature(name: string, info: FeatureInfo): void {
  FEATURE_REGISTRY[name] = info
}

/**
 * Get feature names by supported framework
 */
export function getFeatureNamesForFramework(framework: string): string[] {
  return Object.entries(FEATURE_REGISTRY)
    .filter(([name, _feature]) => isFeatureSupported(name, framework))
    .map(([name]) => name)
}
