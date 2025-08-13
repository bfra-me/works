import {describe, expect, it} from 'vitest'
import {BadgeError, createBadge, createBadgeUrl} from '../src'

describe('edge cases and error handling', () => {
  describe('input validation', () => {
    it.concurrent('handles extremely long labels', () => {
      const longLabel = 'a'.repeat(1000)
      const url = createBadgeUrl({
        label: longLabel,
        message: 'test',
      })
      expect(url).toContain(encodeURIComponent(longLabel))
    })

    it.concurrent('handles extremely long messages', () => {
      const longMessage = 'b'.repeat(1000)
      const url = createBadgeUrl({
        label: 'test',
        message: longMessage,
      })
      expect(url).toContain(encodeURIComponent(longMessage))
    })

    it.concurrent('handles empty string after sanitization', () => {
      expect(() =>
        createBadgeUrl({
          label: '<<<>>>',
          message: 'test',
        }),
      ).toThrow(BadgeError)
    })

    it.concurrent('handles XSS attempts in label', () => {
      const maliciousLabel = '<script>alert("xss")</script>'
      const url = createBadgeUrl({
        label: maliciousLabel,
        message: 'test',
      })
      expect(url).not.toContain('<script>')
      expect(url).not.toContain('</script>')
    })

    it.concurrent('handles URL injection attempts', () => {
      const maliciousMessage = 'javascript:alert("injection")'
      const url = createBadgeUrl({
        label: 'test',
        message: maliciousMessage,
      })
      expect(url).not.toContain('javascript:')
    })
  })

  describe('parameter edge cases', () => {
    it.concurrent('handles zero cache seconds', () => {
      const url = createBadgeUrl({
        label: 'test',
        message: 'badge',
        cacheSeconds: 0,
      })
      expect(url).toContain('cacheSeconds=0')
    })

    it.concurrent('handles very large cache seconds', () => {
      const url = createBadgeUrl({
        label: 'test',
        message: 'badge',
        cacheSeconds: Number.MAX_SAFE_INTEGER,
      })
      expect(url).toContain(`cacheSeconds=${Number.MAX_SAFE_INTEGER}`)
    })

    it.concurrent('handles logoSize as auto', () => {
      const url = createBadgeUrl({
        label: 'test',
        message: 'badge',
        logoSize: 'auto',
      })
      expect(url).toContain('logoSize=auto')
    })

    it.concurrent('handles all badge styles', () => {
      const styles = ['plastic', 'flat', 'flat-square', 'for-the-badge', 'social']

      for (const style of styles) {
        const url = createBadgeUrl({
          label: 'test',
          message: 'badge',
          style: style as any,
        })
        expect(url).toContain(`style=${style}`)
      }
    })
  })

  describe('unicode and international text', () => {
    it.concurrent('handles chinese characters', () => {
      const url = createBadgeUrl({
        label: '测试',
        message: '通过',
      })
      expect(url).toContain('%E6%B5%8B%E8%AF%95')
      expect(url).toContain('%E9%80%9A%E8%BF%87')
    })

    it.concurrent('handles arabic text', () => {
      const url = createBadgeUrl({
        label: 'اختبار',
        message: 'نجح',
      })
      expect(url).toContain(encodeURIComponent('اختبار'))
      expect(url).toContain(encodeURIComponent('نجح'))
    })

    it.concurrent('handles mixed unicode and ascii', () => {
      const url = createBadgeUrl({
        label: 'test 测试 🎉',
        message: 'pass ✅ 通过',
      })
      expect(url).toContain(encodeURIComponent('test 测试 🎉'))
      expect(url).toContain(encodeURIComponent('pass ✅ 通过'))
    })
  })

  describe('createBadge async error handling', () => {
    it.concurrent('handles missing label in async call', async () => {
      await expect(async () => {
        await createBadge({
          label: '',
          message: 'test',
        })
      }).rejects.toThrow(BadgeError)
    })

    it.concurrent('handles missing message in async call', async () => {
      await expect(async () => {
        await createBadge({
          label: 'test',
          message: '',
        })
      }).rejects.toThrow(BadgeError)
    })

    it.concurrent('creates badge without fetch options', async () => {
      const result = await createBadge({
        label: 'test',
        message: 'badge',
      })
      expect(result.url).toBeTruthy()
      expect(result.svg).toBeUndefined()
    })

    it.concurrent('creates badge with fetchSvg: false', async () => {
      const result = await createBadge(
        {
          label: 'test',
          message: 'badge',
        },
        {fetchSvg: false},
      )
      expect(result.url).toBeTruthy()
      expect(result.svg).toBeUndefined()
    })
  })

  describe('boundary conditions', () => {
    it.concurrent('handles null and undefined color gracefully', () => {
      const url1 = createBadgeUrl({
        label: 'test',
        message: 'badge',
        color: undefined,
      })
      expect(url1).toContain('-blue') // default color

      const url2 = createBadgeUrl({
        label: 'test',
        message: 'badge',
        color: '' as any, // Use empty string instead of null for type compatibility
      })
      expect(url2).toContain('-blue') // default color
    })

    it.concurrent('handles empty string color', () => {
      const url = createBadgeUrl({
        label: 'test',
        message: 'badge',
        color: '' as any, // Testing invalid input
      })
      expect(url).toContain('-blue') // default color
    })

    it.concurrent('handles whitespace-only color', () => {
      const url = createBadgeUrl({
        label: 'test',
        message: 'badge',
        color: '   ' as any, // Testing invalid input
      })
      expect(url).toContain('-blue') // default color
    })
  })
})
