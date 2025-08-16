import type {ProjectInfo} from '../types.js'
import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {detect} from 'package-manager-detector'

type PackageManagerName = 'npm' | 'yarn' | 'pnpm' | 'bun'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Analyze an existing project directory.
 *
 * @param projectPath - Path to the project directory
 * @returns Project information
 */
export async function analyzeProject(projectPath: string): Promise<ProjectInfo> {
  const info: ProjectInfo = {
    type: 'unknown',
    packageManager: undefined,
    framework: undefined,
    configurations: [],
    dependencies: [],
    devDependencies: [],
  }

  if (!existsSync(projectPath)) {
    return info
  }

  // Detect package manager
  try {
    const packageManagerResult = await detect({cwd: projectPath})
    if (packageManagerResult) {
      info.packageManager = packageManagerResult.name as PackageManagerName
    }
  } catch {
    // Fallback: check for lock files
    info.packageManager = detectPackageManagerByLockFile(projectPath)
  }

  // Analyze package.json if present
  await analyzePackageJson(projectPath, info)

  // Detect project type and framework
  info.type = detectProjectType(projectPath, info)
  info.framework = detectFramework(projectPath, info)

  // Detect configurations
  info.configurations = detectConfigurations(projectPath)

  return info
}

/**
 * Check if a directory contains a valid Node.js project.
 */
export function isNodeProject(projectPath: string): boolean {
  return existsSync(path.join(projectPath, 'package.json'))
}

/**
 * Check if a directory contains a TypeScript project.
 */
export function isTypeScriptProject(projectPath: string): boolean {
  return (
    existsSync(path.join(projectPath, 'tsconfig.json')) ||
    existsSync(path.join(projectPath, 'tsconfig.build.json')) ||
    hasTypeScriptFiles(projectPath)
  )
}

/**
 * Check if a directory contains a React project.
 */
export function isReactProject(projectPath: string): boolean {
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return false
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson
    const deps = {...packageJson.dependencies, ...packageJson.devDependencies}
    return 'react' in deps || 'react-dom' in deps
  } catch {
    return false
  }
}

/**
 * Get list of missing configurations that could be added.
 */
export function getMissingConfigurations(projectPath: string): string[] {
  const missing: string[] = []

  // Check for common configurations
  const commonConfigs = [
    {name: 'ESLint', files: ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js']},
    {name: 'Prettier', files: ['.prettierrc', '.prettierrc.json', 'prettier.config.js']},
    {name: 'TypeScript', files: ['tsconfig.json']},
    {name: 'Jest', files: ['jest.config.js', 'jest.config.json']},
    {name: 'Vitest', files: ['vitest.config.js', 'vitest.config.ts']},
    {name: 'Husky', files: ['.husky/pre-commit']},
    {name: 'EditorConfig', files: ['.editorconfig']},
    {name: 'GitHub Actions', files: ['.github/workflows']},
  ]

  for (const config of commonConfigs) {
    const hasConfig = config.files.some(file => existsSync(path.join(projectPath, file)))
    if (!hasConfig) {
      missing.push(config.name)
    }
  }

  return missing
}

/**
 * Detect package manager by lock files.
 */
function detectPackageManagerByLockFile(projectPath: string): PackageManagerName | undefined {
  if (existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn'
  }
  if (existsSync(path.join(projectPath, 'bun.lockb'))) {
    return 'bun'
  }
  if (existsSync(path.join(projectPath, 'package-lock.json'))) {
    return 'npm'
  }
  return undefined
}

/**
 * Analyze package.json for dependencies and scripts.
 */
async function analyzePackageJson(projectPath: string, info: ProjectInfo): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return
  }

  try {
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as PackageJson

    // Extract dependencies
    if (packageJson.dependencies) {
      info.dependencies = Object.keys(packageJson.dependencies)
    }

    if (packageJson.devDependencies) {
      info.devDependencies = Object.keys(packageJson.devDependencies)
    }
  } catch {
    // Invalid package.json, ignore
  }
}

/**
 * Detect project type based on dependencies and file structure.
 */
function detectProjectType(projectPath: string, info: ProjectInfo): ProjectInfo['type'] {
  // Check for TypeScript
  if (isTypeScriptProject(projectPath)) {
    return 'typescript'
  }

  // Check for React
  if (isReactProject(projectPath)) {
    return 'react'
  }

  // Check for Vue
  if (
    (info.dependencies && info.dependencies.includes('vue')) ||
    (info.devDependencies && info.devDependencies.includes('vue'))
  ) {
    return 'vue'
  }

  // Check for Angular
  if (
    (info.dependencies && info.dependencies.includes('@angular/core')) ||
    (info.devDependencies && info.devDependencies.includes('@angular/core'))
  ) {
    return 'angular'
  }

  // Check if it's a Node.js project
  if (isNodeProject(projectPath)) {
    return 'node'
  }

  // Default to JavaScript if we find JS files
  if (hasJavaScriptFiles(projectPath)) {
    return 'javascript'
  }

  return 'unknown'
}

/**
 * Detect framework based on dependencies and configuration files.
 */
function detectFramework(_projectPath: string, info: ProjectInfo): string | undefined {
  const allDeps = [...(info.dependencies ?? []), ...(info.devDependencies ?? [])]

  // React frameworks
  if (allDeps.includes('next')) return 'Next.js'
  if (allDeps.includes('gatsby')) return 'Gatsby'
  if (allDeps.includes('react-scripts')) return 'Create React App'

  // Vue frameworks
  if (allDeps.includes('nuxt')) return 'Nuxt.js'
  if (allDeps.includes('@vue/cli-service')) return 'Vue CLI'

  // Build tools
  if (allDeps.includes('vite')) return 'Vite'
  if (allDeps.includes('webpack')) return 'Webpack'
  if (allDeps.includes('parcel')) return 'Parcel'

  // Backend frameworks
  if (allDeps.includes('express')) return 'Express'
  if (allDeps.includes('fastify')) return 'Fastify'
  if (allDeps.includes('koa')) return 'Koa'
  if (allDeps.includes('nestjs')) return 'NestJS'

  // Static site generators
  if (allDeps.includes('astro')) return 'Astro'
  if (allDeps.includes('eleventy')) return '11ty'

  return undefined
}

/**
 * Detect existing configuration files.
 */
function detectConfigurations(projectPath: string): string[] {
  const configs: string[] = []

  const configFiles = [
    {name: 'ESLint', patterns: ['.eslintrc*', 'eslint.config.*']},
    {name: 'Prettier', patterns: ['.prettierrc*', 'prettier.config.*']},
    {name: 'TypeScript', patterns: ['tsconfig*.json']},
    {name: 'Jest', patterns: ['jest.config.*']},
    {name: 'Vitest', patterns: ['vitest.config.*']},
    {name: 'Babel', patterns: ['.babelrc*', 'babel.config.*']},
    {name: 'PostCSS', patterns: ['postcss.config.*']},
    {name: 'Tailwind CSS', patterns: ['tailwind.config.*']},
    {name: 'Vite', patterns: ['vite.config.*']},
    {name: 'Webpack', patterns: ['webpack.config.*']},
    {name: 'Rollup', patterns: ['rollup.config.*']},
    {name: 'EditorConfig', patterns: ['.editorconfig']},
    {name: 'Husky', patterns: ['.husky/']},
    {name: 'lint-staged', patterns: ['.lintstagedrc*']},
    {name: 'Renovate', patterns: ['renovate.json', '.renovaterc*']},
    {name: 'Dependabot', patterns: ['.github/dependabot.yml']},
    {name: 'GitHub Actions', patterns: ['.github/workflows/']},
    {name: 'Docker', patterns: ['Dockerfile', 'docker-compose.yml']},
  ]

  for (const config of configFiles) {
    const hasConfig = config.patterns.some(pattern => {
      if (pattern.endsWith('/')) {
        // Directory check
        return existsSync(path.join(projectPath, pattern))
      } else if (pattern.includes('*')) {
        // Pattern matching - simplified check
        const baseName = pattern.replaceAll('*', '')
        try {
          const files = readdirSync(projectPath)
          return files.some(file => file.includes(baseName))
        } catch {
          return false
        }
      }
      // Exact file check
      return existsSync(path.join(projectPath, pattern))
    })

    if (hasConfig) {
      configs.push(config.name)
    }
  }

  return configs
}

/**
 * Check if directory has TypeScript files.
 */
function hasTypeScriptFiles(projectPath: string): boolean {
  try {
    const files = readdirSync(projectPath)
    return files.some(file => file.endsWith('.ts') || file.endsWith('.tsx'))
  } catch {
    return false
  }
}

/**
 * Check if directory has JavaScript files.
 */
function hasJavaScriptFiles(projectPath: string): boolean {
  try {
    const files = readdirSync(projectPath)
    return files.some(
      file => file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.mjs'),
    )
  } catch {
    return false
  }
}
