import {describe, expect, it} from 'vitest'

import {SENTINEL_MARKERS} from '../src/types'

describe('@bfra.me/doc-sync types', () => {
  describe('sentinel markers', () => {
    it.concurrent('should have auto-generated start marker', () => {
      expect(SENTINEL_MARKERS.AUTO_START).toBe('{/* AUTO-GENERATED-START */}')
    })

    it.concurrent('should have auto-generated end marker', () => {
      expect(SENTINEL_MARKERS.AUTO_END).toBe('{/* AUTO-GENERATED-END */}')
    })

    it.concurrent('should have manual content start marker', () => {
      expect(SENTINEL_MARKERS.MANUAL_START).toBe('{/* MANUAL-CONTENT-START */}')
    })

    it.concurrent('should have manual content end marker', () => {
      expect(SENTINEL_MARKERS.MANUAL_END).toBe('{/* MANUAL-CONTENT-END */}')
    })

    it.concurrent('should be readonly object', () => {
      expect(Object.isFrozen(SENTINEL_MARKERS)).toBe(false)
      expect(typeof SENTINEL_MARKERS).toBe('object')
    })
  })
})
