import process from 'node:process'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

describe('@bfra.me/es/env - runtime detection', () => {
  const originalEnv = {...process.env}

  beforeEach(() => {
    vi.resetModules()
    vi.doMock('is-in-ci', () => ({default: false}))
    process.env = {...originalEnv}
    delete process.env.GIT_PARAMS
    delete process.env.VSCODE_GIT_COMMAND
    delete process.env.npm_lifecycle_script
    delete process.env.VSCODE_PID
    delete process.env.VSCODE_CWD
    delete process.env.JETBRAINS_IDE
    delete process.env.VIM
    delete process.env.NVIM
  })

  afterEach(() => {
    process.env = {...originalEnv}
    vi.resetModules()
  })

  describe('isNode', () => {
    it('should return true when running in Node.js', async () => {
      const {isNode} = await import('../../src/env/runtime')
      expect(isNode()).toBe(true)
    })

    it('should return a boolean type', async () => {
      const {isNode} = await import('../../src/env/runtime')
      const result = isNode()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isBrowser', () => {
    it('should return false when running in Node.js', async () => {
      const {isBrowser} = await import('../../src/env/runtime')
      expect(isBrowser()).toBe(false)
    })

    it('should return a boolean type', async () => {
      const {isBrowser} = await import('../../src/env/runtime')
      const result = isBrowser()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isDeno', () => {
    it('should return false when running in Node.js', async () => {
      const {isDeno} = await import('../../src/env/runtime')
      expect(isDeno()).toBe(false)
    })

    it('should return a boolean type', async () => {
      const {isDeno} = await import('../../src/env/runtime')
      const result = isDeno()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getEnvironment', () => {
    it('should return comprehensive environment info in Node.js', async () => {
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(env).toEqual({
        isNode: true,
        isBrowser: false,
        isDeno: false,
        isCI: false,
        isEditor: false,
        isGitLifecycle: false,
      })
    })

    it('should return an object with all required properties', async () => {
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(env).toHaveProperty('isNode')
      expect(env).toHaveProperty('isBrowser')
      expect(env).toHaveProperty('isDeno')
      expect(env).toHaveProperty('isCI')
      expect(env).toHaveProperty('isEditor')
      expect(env).toHaveProperty('isGitLifecycle')
    })

    it('should return all boolean properties', async () => {
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(typeof env.isNode).toBe('boolean')
      expect(typeof env.isBrowser).toBe('boolean')
      expect(typeof env.isDeno).toBe('boolean')
      expect(typeof env.isCI).toBe('boolean')
      expect(typeof env.isEditor).toBe('boolean')
      expect(typeof env.isGitLifecycle).toBe('boolean')
    })

    it('should reflect editor environment when set', async () => {
      process.env.VSCODE_PID = '12345'
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(env.isEditor).toBe(true)
    })

    it('should reflect git lifecycle when set', async () => {
      process.env.GIT_PARAMS = 'commit'
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(env.isGitLifecycle).toBe(true)
    })

    it('should reflect CI environment when set', async () => {
      vi.doMock('is-in-ci', () => ({default: true}))
      const {getEnvironment} = await import('../../src/env/runtime')
      const env = getEnvironment()

      expect(env.isCI).toBe(true)
    })
  })
})
