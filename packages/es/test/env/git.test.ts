import process from 'node:process'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('@bfra.me/es/env - isInGitLifecycle', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {...originalEnv}
    delete process.env.GIT_PARAMS
    delete process.env.VSCODE_GIT_COMMAND
    delete process.env.npm_lifecycle_script
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  describe('git_params detection', () => {
    it('should detect git lifecycle via GIT_PARAMS', async () => {
      process.env.GIT_PARAMS = 'commit'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })

    it('should return false with empty GIT_PARAMS value', async () => {
      process.env.GIT_PARAMS = ''
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(false)
    })
  })

  describe('vscode_git_command detection', () => {
    it('should detect git lifecycle via VSCODE_GIT_COMMAND', async () => {
      process.env.VSCODE_GIT_COMMAND = 'push'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })
  })

  describe('lint-staged detection', () => {
    it('should detect lint-staged via npm_lifecycle_script', async () => {
      process.env.npm_lifecycle_script = 'lint-staged'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })

    it('should detect lint-staged with arguments', async () => {
      process.env.npm_lifecycle_script = 'lint-staged --config .lintstagedrc'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })
  })

  describe('nano-staged detection', () => {
    it('should detect nano-staged via npm_lifecycle_script', async () => {
      process.env.npm_lifecycle_script = 'nano-staged'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })

    it('should detect nano-staged with arguments', async () => {
      process.env.npm_lifecycle_script = 'nano-staged --allow-empty'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })
  })

  describe('no git lifecycle', () => {
    it('should return false when no git lifecycle variables are set', async () => {
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(false)
    })

    it('should return false when npm_lifecycle_script is unrelated', async () => {
      process.env.npm_lifecycle_script = 'vitest run'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(false)
    })

    it('should return a boolean type', async () => {
      const {isInGitLifecycle} = await import('../../src/env/git')
      const result = isInGitLifecycle()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('multiple git lifecycle indicators', () => {
    it('should detect when multiple git variables are set', async () => {
      process.env.GIT_PARAMS = 'commit'
      process.env.npm_lifecycle_script = 'lint-staged'
      const {isInGitLifecycle} = await import('../../src/env/git')
      expect(isInGitLifecycle()).toBe(true)
    })
  })
})
