import process from 'node:process'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('@bfra.me/es/env - isInEditorEnv', () => {
  const originalEnv = {...process.env}

  beforeEach(() => {
    vi.resetModules()
    vi.doMock('is-in-ci', () => ({default: false}))
    // Clean up environment variables
    delete process.env.VSCODE_PID
    delete process.env.VSCODE_CWD
    delete process.env.JETBRAINS_IDE
    delete process.env.VIM
    delete process.env.NVIM
    delete process.env.GIT_PARAMS
    delete process.env.VSCODE_GIT_COMMAND
    delete process.env.npm_lifecycle_script
  })

  afterEach(() => {
    // Restore original environment
    process.env = {...originalEnv}
    vi.resetModules()
  })

  describe('vs code detection', () => {
    it('should detect VS Code via VSCODE_PID', async () => {
      process.env.VSCODE_PID = '12345'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })

    it('should detect VS Code via VSCODE_CWD', async () => {
      process.env.VSCODE_CWD = '/some/path'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })
  })

  describe('jetbrains ide detection', () => {
    it('should detect JetBrains IDEs via JETBRAINS_IDE', async () => {
      process.env.JETBRAINS_IDE = 'WebStorm'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })
  })

  describe('vim detection', () => {
    it('should detect Vim via VIM', async () => {
      process.env.VIM = '/usr/share/vim'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })

    it('should detect Neovim via NVIM', async () => {
      process.env.NVIM = '/usr/bin/nvim'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })
  })

  describe('ci environment exclusion', () => {
    it('should return false when in CI environment', async () => {
      vi.doMock('is-in-ci', () => ({default: true}))
      process.env.VSCODE_PID = '12345'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(false)
    })
  })

  describe('git lifecycle exclusion', () => {
    it('should return false when in git lifecycle (GIT_PARAMS)', async () => {
      process.env.VSCODE_PID = '12345'
      process.env.GIT_PARAMS = 'commit'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(false)
    })

    it('should return false when running lint-staged', async () => {
      process.env.VSCODE_PID = '12345'
      process.env.npm_lifecycle_script = 'lint-staged'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(false)
    })
  })

  describe('no editor environment', () => {
    it('should return false when no editor environment variables are set', async () => {
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(false)
    })

    it('should return a boolean type', async () => {
      const {isInEditorEnv} = await import('../../src/env/editor')
      const result = isInEditorEnv()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('multiple editor environments', () => {
    it('should detect when multiple editor variables are set', async () => {
      process.env.VSCODE_PID = '12345'
      process.env.VIM = '/usr/share/vim'
      const {isInEditorEnv} = await import('../../src/env/editor')
      expect(isInEditorEnv()).toBe(true)
    })
  })
})
