/**
 * Tests for create-cursor-rule.ts
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

// Create mocks
const mockExit = vi.fn()
const mockWriteFile = vi.fn().mockResolvedValue(undefined)
const mockMkdir = vi.fn().mockResolvedValue(undefined)
const mockAccess = vi.fn()
const mockInfo = vi.fn()
const mockError = vi.fn()
const mockSuccess = vi.fn()

// Store test-specific argv
let testArgv = ['node', 'create-cursor-rule.ts']

// Mock process with a getter for argv
vi.mock('node:process', () => {
  const process = {
    exit: mockExit,
    get argv() {
      return testArgv
    },
    cwd: () => '/fake/cwd',
  }
  return {default: process}
})

// Mock fs promises
vi.mock('node:fs', () => ({
  promises: {
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    access: mockAccess,
  },
}))

// Mock consola
vi.mock('consola', () => ({
  consola: {
    info: mockInfo,
    error: mockError,
    success: mockSuccess,
  },
}))

describe('create-cursor-rule', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockAccess.mockRejectedValue(new Error('File not found'))

    // Reset test arguments to default
    testArgv = ['node', 'create-cursor-rule.ts']
  })

  afterEach(() => {
    // Clear module cache after each test
    vi.resetModules()
  })

  describe('CLI behavior', () => {
    it('should create a rule file with default options', async () => {
      // Set up arguments
      testArgv = ['node', 'create-cursor-rule.ts', 'test-rule']

      // Run the script
      await import('../create-cursor-rule')

      // Verify mkdir was called
      expect(mockMkdir).toHaveBeenCalled()

      // Verify writeFile was called
      expect(mockWriteFile).toHaveBeenCalled()

      // Check content of file
      const fileContent = mockWriteFile.mock.calls[0]?.[1]
      expect(fileContent).toContain('name: test_rule')
      expect(fileContent).toContain('priority: medium')
      expect(fileContent).toContain('version: 1.0.0')

      // Verify success message
      expect(mockSuccess).toHaveBeenCalled()
    })

    it('should normalize rule name with spaces', async () => {
      // Set up arguments
      testArgv = ['node', 'create-cursor-rule.ts', 'rule with spaces']

      // Run the script
      await import('../create-cursor-rule')

      // Verify info message
      expect(mockInfo).toHaveBeenCalledWith('Normalized rule name to: rule-with-spaces')

      // Verify file was created with normalized name
      const filePath = mockWriteFile.mock.calls[0]?.[0]
      expect(filePath).toContain('rule-with-spaces.mdc')
    })

    it('should fail if no rule name is provided', async () => {
      // Set up arguments - no rule name
      testArgv = ['node', 'create-cursor-rule.ts']

      // Run the script
      await import('../create-cursor-rule')

      // Verify error message and exit
      expect(mockError).toHaveBeenCalledWith('Rule name is required as the first argument')
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should exit with error when file already exists', async () => {
      // Mock file existence
      mockAccess.mockResolvedValueOnce(undefined)

      // Set up arguments
      testArgv = ['node', 'create-cursor-rule.ts', 'existing-rule']

      // Run the script
      await import('../create-cursor-rule')

      // Verify error message and exit
      expect(mockError).toHaveBeenCalledWith(expect.stringContaining('already exists'))
      expect(mockExit).toHaveBeenCalledWith(1)
    })

    it('should handle filesystem errors gracefully', async () => {
      // Make mkdir fail
      mockMkdir.mockRejectedValueOnce(new Error('Test error'))

      // Set up arguments
      testArgv = ['node', 'create-cursor-rule.ts', 'error-rule']

      // Run the script
      await import('../create-cursor-rule')

      // Verify error message and exit
      expect(mockError).toHaveBeenCalledWith('Failed to create cursor rule:', 'Test error')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })
})
