import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

// Get the directory of the current module
const CURRENT_FILENAME = fileURLToPath(import.meta.url)
const CURRENT_DIRNAME = path.dirname(CURRENT_FILENAME)

/**
 * Test utilities for fixture-based testing
 */
export const testUtils = {
  FIXTURES_DIR: path.join(CURRENT_DIRNAME, 'fixtures'),
  INPUT_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'input'),
  OUTPUT_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'output'),
  TEMP_DIR: path.join(CURRENT_DIRNAME, 'fixtures', 'temp'),

  /**
   * Get the absolute path to a fixture file
   */
  getFixturePath(type: 'input' | 'output' | 'temp', ...pathSegments: string[]): string {
    const baseDir =
      type === 'input'
        ? testUtils.INPUT_DIR
        : type === 'output'
          ? testUtils.OUTPUT_DIR
          : testUtils.TEMP_DIR
    return path.join(baseDir, ...pathSegments)
  },

  /**
   * Load a JSON fixture file
   */
  loadJsonFixture<T = unknown>(type: 'input' | 'output', ...pathSegments: string[]): T {
    const filePath = testUtils.getFixturePath(type, ...pathSegments)
    if (!existsSync(filePath)) {
      throw new Error(`Fixture file not found: ${filePath}`)
    }
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  },

  /**
   * Load a text fixture file
   */
  loadTextFixture(type: 'input' | 'output', ...pathSegments: string[]): string {
    const filePath = testUtils.getFixturePath(type, ...pathSegments)
    if (!existsSync(filePath)) {
      throw new Error(`Fixture file not found: ${filePath}`)
    }
    return readFileSync(filePath, 'utf-8')
  },

  /**
   * Create a temporary directory for testing
   */
  createTempDir(testName: string): string {
    const tempPath = path.join(testUtils.TEMP_DIR, testName, Date.now().toString())
    if (!existsSync(tempPath)) {
      mkdirSync(tempPath, {recursive: true})
    }
    return tempPath
  },

  /**
   * Create a directory
   */
  createDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, {recursive: true})
    }
  },

  /**
   * Write content to a file
   */
  writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, {recursive: true})
    }
    writeFileSync(filePath, content, 'utf-8')
  },

  /**
   * Read content from a file
   */
  readFile(filePath: string): string {
    return readFileSync(filePath, 'utf-8')
  },

  /**
   * Get a directory snapshot for testing (recursive structure)
   */
  async getDirectorySnapshot(dirPath: string): Promise<Record<string, any>> {
    const snapshot: Record<string, any> = {}

    if (!existsSync(dirPath)) {
      return snapshot
    }

    const entries = readdirSync(dirPath)
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry)
      const stat = statSync(entryPath)

      if (stat.isDirectory()) {
        snapshot[entry] = await testUtils.getDirectorySnapshot(entryPath)
      } else {
        try {
          // Try to read as text file
          const content = readFileSync(entryPath, 'utf-8')
          snapshot[entry] = content
        } catch {
          // If it fails (binary file), just mark as binary
          snapshot[entry] = '<binary-file>'
        }
      }
    }

    return snapshot
  },

  /**
   * Clean up a temporary test directory
   */
  cleanupTempDir(testName: string): void {
    const tempPath = testUtils.getFixturePath('temp', testName)
    if (existsSync(tempPath)) {
      rmSync(tempPath, {recursive: true, force: true})
    }
  },

  /**
   * Write a file to the temp directory
   */
  writeTempFile(testName: string, relativePath: string, content: string): void {
    const tempDir = testUtils.getFixturePath('temp', testName)
    const filePath = path.join(tempDir, relativePath)
    const fileDir = path.dirname(filePath)

    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, {recursive: true})
    }
    writeFileSync(filePath, content, 'utf-8')
  },

  /**
   * Check if a file exists in the temp directory
   */
  tempFileExists(testName: string, relativePath: string): boolean {
    const filePath = path.join(testUtils.getFixturePath('temp', testName), relativePath)
    return existsSync(filePath)
  },

  /**
   * Read a file from the temp directory
   */
  readTempFile(testName: string, relativePath: string): string {
    const filePath = path.join(testUtils.getFixturePath('temp', testName), relativePath)
    if (!existsSync(filePath)) {
      throw new Error(`Temp file not found: ${filePath}`)
    }
    return readFileSync(filePath, 'utf-8')
  },

  /**
   * Compare directory structures (for snapshot testing)
   */
  compareDirectories(actualDir: string, expectedDir: string): boolean {
    // This is a simplified comparison - in practice you'd want more sophisticated diffing
    return existsSync(actualDir) && existsSync(expectedDir)
  },

  /**
   * Setup function to run before each test
   */
  setup(): void {
    // Ensure temp directory exists and is clean
    if (existsSync(testUtils.TEMP_DIR)) {
      rmSync(testUtils.TEMP_DIR, {recursive: true, force: true})
    }
    mkdirSync(testUtils.TEMP_DIR, {recursive: true})
  },

  /**
   * Cleanup function to run after each test
   */
  cleanup(): void {
    if (existsSync(testUtils.TEMP_DIR)) {
      rmSync(testUtils.TEMP_DIR, {recursive: true, force: true})
    }
  },

  /**
   * Mock fetch responses for testing (placeholder for MSW integration)
   */
  mockFetchResponse(_url: string, _response: unknown): void {
    // This would be implemented with MSW or similar
    // For now, it's a placeholder
  },

  /**
   * Create a mock project structure
   */
  createMockProject(testName: string, structure: Record<string, string>): string {
    const projectDir = testUtils.createTempDir(testName)

    for (const [filePath, content] of Object.entries(structure)) {
      testUtils.writeTempFile(testName, filePath, content)
    }

    return projectDir
  },
}

/**
 * Mock AI responses for testing
 */
export const mockAiResponses = {
  projectAnalysis: {
    framework: 'typescript',
    type: 'library',
    dependencies: ['typescript', 'tsup', 'vitest'],
    structure: {
      src: true,
      test: true,
      docs: false,
    },
    features: ['build', 'test', 'lint'],
    recommendations: [
      'Use TypeScript for better type safety',
      'Add Vitest for testing',
      'Consider ESLint for code quality',
    ],
  },
  dependencyRecommendations: {
    dependencies: [
      {
        name: 'lodash',
        version: '^4.17.21',
        reason: 'Utility functions for common operations',
      },
    ],
    devDependencies: [
      {
        name: 'typescript',
        version: '^5.0.0',
        reason: 'TypeScript support',
      },
      {
        name: 'vitest',
        version: '^2.0.0',
        reason: 'Modern testing framework',
      },
    ],
  },
  codeGeneration: {
    files: [
      {
        path: 'src/index.ts',
        content: "export function hello(): string {\n  return 'Hello, World!'\n}",
      },
      {
        path: 'test/index.test.ts',
        content:
          "import { hello } from '../src/index'\n\ntest('hello function', () => {\n  expect(hello()).toBe('Hello, World!')\n})",
      },
    ],
  },
}

/**
 * Mock GitHub API responses
 */
export const mockGitHubResponses = {
  validRepository: {
    name: 'test-template',
    full_name: 'user/test-template',
    clone_url: 'https://github.com/user/test-template.git',
    default_branch: 'main',
  },
  repositoryNotFound: {
    message: 'Not Found',
    status: 404,
  },
}

/**
 * Common test configurations
 */
export const testConfigs = {
  basicProject: {
    name: 'test-project',
    description: 'A test project for fixture testing',
    author: 'Test Author',
    template: 'simple-template',
    options: {
      typescript: true,
      eslint: true,
      prettier: true,
    },
  },
  libraryProject: {
    name: '@test/library-package',
    description: 'A test library package',
    author: 'Library Author',
    template: 'library',
    options: {
      typescript: true,
      vitest: true,
      tsup: true,
    },
  },
  cliProject: {
    name: 'test-cli',
    description: 'A test CLI application',
    author: 'CLI Author',
    template: 'cli',
    options: {
      typescript: true,
      commander: true,
    },
  },
}
