import {describe, expect, it} from 'vitest'

import {matchAnyPattern, matchPattern, normalizePath} from '../../src/utils/pattern-matcher'

describe('pattern-matcher', () => {
  describe('normalizePath', () => {
    it.concurrent('should convert backslashes to forward slashes', () => {
      expect(normalizePath(String.raw`src\utils\index.ts`)).toBe('src/utils/index.ts')
    })

    it.concurrent('should preserve forward slashes', () => {
      expect(normalizePath('src/utils/index.ts')).toBe('src/utils/index.ts')
    })

    it.concurrent('should handle mixed slashes', () => {
      expect(normalizePath(String.raw`src\utils/test\file.ts`)).toBe('src/utils/test/file.ts')
    })
  })

  describe('matchPattern', () => {
    it.concurrent('should match exact paths', () => {
      expect(matchPattern('src/index.ts', 'src/index.ts')).toBe(true)
    })

    it.concurrent('should match with single asterisk wildcard', () => {
      expect(matchPattern('src/utils.ts', 'src/*.ts')).toBe(true)
      expect(matchPattern('src/helpers.ts', 'src/*.ts')).toBe(true)
      expect(matchPattern('lib/utils.ts', 'src/*.ts')).toBe(false)
    })

    it.concurrent('should match with double asterisk wildcard', () => {
      expect(matchPattern('src/components/Button.tsx', '**/Button.tsx')).toBe(true)
      expect(matchPattern('deep/nested/path/Button.tsx', '**/Button.tsx')).toBe(true)
    })

    it.concurrent('should match directory patterns', () => {
      expect(matchPattern('src/domain/models/user.ts', '**/domain/**')).toBe(true)
      expect(matchPattern('src/application/services/auth.ts', '**/application/**')).toBe(true)
      expect(matchPattern('src/other/file.ts', '**/domain/**')).toBe(false)
    })

    it.concurrent('should handle index.ts patterns', () => {
      expect(matchPattern('src/index.ts', '**/index.ts')).toBe(true)
      expect(matchPattern('packages/es/src/index.ts', '**/index.ts')).toBe(true)
    })

    it.concurrent('should normalize Windows-style paths', () => {
      expect(matchPattern(String.raw`src\domain\user.ts`, '**/domain/**')).toBe(true)
    })
  })

  describe('matchAnyPattern', () => {
    it.concurrent('should return true if any pattern matches', () => {
      const patterns = ['**/node_modules/**', '**/dist/**', '**/coverage/**']
      expect(matchAnyPattern('path/to/node_modules/lodash/index.js', patterns)).toBe(true)
      expect(matchAnyPattern('output/dist/bundle.js', patterns)).toBe(true)
    })

    it.concurrent('should return false if no pattern matches', () => {
      const patterns = ['**/node_modules/**', '**/dist/**']
      expect(matchAnyPattern('src/utils/helpers.ts', patterns)).toBe(false)
    })

    it.concurrent('should handle empty patterns array', () => {
      expect(matchAnyPattern('src/file.ts', [])).toBe(false)
    })

    it.concurrent('should match allowed file patterns', () => {
      const allowedPatterns = ['**/index.ts', '**/*.d.ts']
      expect(matchAnyPattern('src/index.ts', allowedPatterns)).toBe(true)
      expect(matchAnyPattern('types/global.d.ts', allowedPatterns)).toBe(true)
      expect(matchAnyPattern('src/utils.ts', allowedPatterns)).toBe(false)
    })
  })
})
