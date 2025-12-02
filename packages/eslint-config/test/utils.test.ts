import {describe, expect, it} from 'vitest'
import {isPackageInScope} from '../src/utils'

describe('utils', () => {
  describe('isPackageInScope', () => {
    it('returns true for existing packages', () => {
      expect(isPackageInScope('typescript')).toBe(true)
    })

    it('returns false for non-existing packages', () => {
      expect(isPackageInScope('non-existent-package-xyz')).toBe(false)
    })
  })
})
