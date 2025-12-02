import type {
  AbsolutePath,
  Brand,
  NonEmptyString,
  Opaque,
  PositiveInteger,
  ValidPath,
} from '../../src/types'

import {describe, expect, it} from 'vitest'

import {brand, unbrand} from '../../src/types'

describe('@bfra.me/es/types - branded types', () => {
  describe('brand()', () => {
    it.concurrent('should brand a string value', () => {
      const value = 'hello'
      const branded = brand<string, 'TestBrand'>(value)
      expect(branded).toBe('hello')
    })

    it.concurrent('should brand a number value', () => {
      const value = 42
      const branded = brand<number, 'TestNumber'>(value)
      expect(branded).toBe(42)
    })

    it.concurrent('should brand an object value', () => {
      const value = {foo: 'bar'}
      const branded = brand<typeof value, 'TestObject'>(value)
      expect(branded).toEqual({foo: 'bar'})
    })

    it.concurrent('should preserve reference identity for objects', () => {
      const value = {foo: 'bar'}
      const branded = brand<typeof value, 'TestObject'>(value)
      expect(branded).toBe(value)
    })
  })

  describe('unbrand()', () => {
    it.concurrent('should unbrand a branded string', () => {
      const branded = brand<string, 'TestBrand'>('hello')
      const unbranded = unbrand(branded)
      expect(unbranded).toBe('hello')
    })

    it.concurrent('should unbrand a branded number', () => {
      const branded = brand<number, 'TestNumber'>(42)
      const unbranded = unbrand(branded)
      expect(unbranded).toBe(42)
    })

    it.concurrent('should unbrand a branded object', () => {
      const original = {foo: 'bar'}
      const branded = brand<typeof original, 'TestObject'>(original)
      const unbranded = unbrand(branded)
      expect(unbranded).toEqual({foo: 'bar'})
      expect(unbranded).toBe(original)
    })
  })

  describe('brand type', () => {
    it.concurrent('should work with type assertions', () => {
      type UserId = Brand<string, 'UserId'>
      const userId = 'user-123' as UserId
      expect(userId).toBe('user-123')
    })

    it.concurrent('should work with branded factory', () => {
      type Email = Brand<string, 'Email'>
      const email: Email = brand<string, 'Email'>('test@example.com')
      expect(email).toBe('test@example.com')
    })
  })

  describe('opaque type', () => {
    it.concurrent('should work similar to Brand', () => {
      type Token = Opaque<string, 'Token'>
      const token = 'secret-token' as Token
      expect(token).toBe('secret-token')
    })
  })

  describe('nonEmptyString type', () => {
    it.concurrent('should brand non-empty strings', () => {
      const value: NonEmptyString = brand<string, 'NonEmptyString'>('hello')
      expect(value).toBe('hello')
    })

    it.concurrent('should allow any string at runtime (validation is separate concern)', () => {
      const value: NonEmptyString = brand<string, 'NonEmptyString'>('')
      expect(value).toBe('')
    })
  })

  describe('positiveInteger type', () => {
    it.concurrent('should brand positive integers', () => {
      const value: PositiveInteger = brand<number, 'PositiveInteger'>(42)
      expect(value).toBe(42)
    })

    it.concurrent('should allow any number at runtime (validation is separate concern)', () => {
      const value: PositiveInteger = brand<number, 'PositiveInteger'>(-5)
      expect(value).toBe(-5)
    })
  })

  describe('validPath type', () => {
    it.concurrent('should brand valid paths', () => {
      const value: ValidPath = brand<string, 'ValidPath'>('/home/user/file.txt')
      expect(value).toBe('/home/user/file.txt')
    })

    it.concurrent('should brand relative paths', () => {
      const value: ValidPath = brand<string, 'ValidPath'>('./relative/path')
      expect(value).toBe('./relative/path')
    })
  })

  describe('absolutePath type', () => {
    it.concurrent('should brand absolute Unix paths', () => {
      const value: AbsolutePath = brand<string, 'AbsolutePath'>('/usr/local/bin')
      expect(value).toBe('/usr/local/bin')
    })

    it.concurrent('should brand absolute Windows paths', () => {
      const value: AbsolutePath = brand<string, 'AbsolutePath'>(String.raw`C:\Users\Test`)
      expect(value).toBe(String.raw`C:\Users\Test`)
    })
  })

  describe('type safety (compile-time)', () => {
    it.concurrent('branded values should be usable as base type', () => {
      type UserId = Brand<string, 'UserId'>
      const userId: UserId = brand<string, 'UserId'>('user-123')

      const acceptsString = (s: string): string => s.toUpperCase()
      expect(acceptsString(userId)).toBe('USER-123')
    })

    it.concurrent('branded numbers should support arithmetic', () => {
      type Score = Brand<number, 'Score'>
      const score: Score = brand<number, 'Score'>(100)

      const doubled: number = score * 2
      expect(doubled).toBe(200)
    })

    it.concurrent('different brands create incompatible types at compile time', () => {
      type UserId = Brand<string, 'UserId'>
      type OrderId = Brand<string, 'OrderId'>

      const userId: UserId = brand<string, 'UserId'>('user-123')
      const orderId: OrderId = brand<string, 'OrderId'>('order-456')

      // Runtime values are still strings
      expect(typeof userId).toBe('string')
      expect(typeof orderId).toBe('string')

      // Functions can accept specific branded types
      const processUser = (id: UserId): string => `Processing user: ${id}`
      const processOrder = (id: OrderId): string => `Processing order: ${id}`

      expect(processUser(userId)).toBe('Processing user: user-123')
      expect(processOrder(orderId)).toBe('Processing order: order-456')
    })

    it.concurrent('branded types preserve underlying value operations', () => {
      type SafeHtml = Brand<string, 'SafeHtml'>
      const html: SafeHtml = brand<string, 'SafeHtml'>('<div>content</div>')

      expect(html.length).toBe(18)
      expect(html.includes('div')).toBe(true)
      expect(html.startsWith('<')).toBe(true)
    })
  })

  describe('roundtrip operations', () => {
    it.concurrent('brand then unbrand should return original value', () => {
      const original = 'test-value'
      const branded = brand<string, 'Test'>(original)
      const unbranded = unbrand(branded)

      expect(unbranded).toBe(original)
    })

    it.concurrent('brand then unbrand preserves object reference', () => {
      const original = {nested: {value: 42}}
      const branded = brand<typeof original, 'Config'>(original)
      const unbranded = unbrand(branded)

      expect(unbranded).toBe(original)
      expect(unbranded.nested.value).toBe(42)
    })

    it.concurrent('multiple brand operations on same value are independent', () => {
      type UserId = Brand<string, 'UserId'>
      type SessionId = Brand<string, 'SessionId'>

      const value = 'shared-123'
      const userId: UserId = brand<string, 'UserId'>(value)
      const sessionId: SessionId = brand<string, 'SessionId'>(value)

      expect(unbrand(userId)).toBe(value)
      expect(unbrand(sessionId)).toBe(value)
      expect(unbrand(userId)).toBe(unbrand(sessionId))
    })
  })

  describe('edge cases', () => {
    it.concurrent('should handle empty string branding', () => {
      type Token = Brand<string, 'Token'>
      const emptyToken: Token = brand<string, 'Token'>('')

      expect(emptyToken).toBe('')
      expect(unbrand(emptyToken)).toBe('')
    })

    it.concurrent('should handle zero branding', () => {
      type Count = Brand<number, 'Count'>
      const zeroCount: Count = brand<number, 'Count'>(0)

      expect(zeroCount).toBe(0)
      expect(unbrand(zeroCount)).toBe(0)
    })

    it.concurrent('should handle negative number branding', () => {
      type Offset = Brand<number, 'Offset'>
      const negativeOffset: Offset = brand<number, 'Offset'>(-100)

      expect(negativeOffset).toBe(-100)
      expect(unbrand(negativeOffset)).toBe(-100)
    })

    it.concurrent('should handle Infinity branding', () => {
      type Limit = Brand<number, 'Limit'>
      const infiniteLimit: Limit = brand<number, 'Limit'>(Infinity)

      expect(infiniteLimit).toBe(Infinity)
      expect(unbrand(infiniteLimit)).toBe(Infinity)
    })

    it.concurrent('should handle boolean branding', () => {
      type Flag = Brand<boolean, 'Flag'>
      const trueFlag: Flag = brand<boolean, 'Flag'>(true)
      const falseFlag: Flag = brand<boolean, 'Flag'>(false)

      expect(trueFlag).toBe(true)
      expect(falseFlag).toBe(false)
    })

    it.concurrent('should handle null-prototype objects', () => {
      const nullProtoObj = Object.create(null) as Record<string, string>
      nullProtoObj.key = 'value'

      type Config = Brand<typeof nullProtoObj, 'Config'>
      const branded: Config = brand<typeof nullProtoObj, 'Config'>(nullProtoObj)

      expect(branded.key).toBe('value')
      expect(Object.getPrototypeOf(branded)).toBeNull()
    })

    it.concurrent('should handle array branding', () => {
      type IdList = Brand<string[], 'IdList'>
      const ids: IdList = brand<string[], 'IdList'>(['a', 'b', 'c'])

      expect(ids.length).toBe(3)
      expect(ids[0]).toBe('a')
      expect(unbrand(ids)).toEqual(['a', 'b', 'c'])
    })

    it.concurrent('should handle function branding', () => {
      type Handler = Brand<() => void, 'Handler'>
      const fn = (): void => {}
      const handler: Handler = brand<() => void, 'Handler'>(fn)

      expect(typeof handler).toBe('function')
      expect(handler).toBe(fn)
    })

    it.concurrent('should handle symbol branding', () => {
      type UniqueSymbol = Brand<symbol, 'UniqueSymbol'>
      const sym = Symbol('test')
      const branded: UniqueSymbol = brand<symbol, 'UniqueSymbol'>(sym)

      expect(typeof branded).toBe('symbol')
      expect(branded).toBe(sym)
    })

    it.concurrent('should handle bigint branding', () => {
      type LargeId = Brand<bigint, 'LargeId'>
      const bigId: LargeId = brand<bigint, 'LargeId'>(BigInt('9007199254740993'))

      expect(typeof bigId).toBe('bigint')
      expect(bigId).toBe(BigInt('9007199254740993'))
    })
  })

  describe('type narrowing with branded types', () => {
    it.concurrent('branded types work with typeof checks', () => {
      type Amount = Brand<number, 'Amount'>
      const amount: Amount = brand<number, 'Amount'>(42)

      expect(typeof amount === 'number').toBe(true)
    })

    it.concurrent('branded types work with instanceof checks for objects', () => {
      class CustomError extends Error {
        code = 'CUSTOM'
      }
      type BrandedError = Brand<CustomError, 'BrandedError'>

      const error = new CustomError('test')
      const branded: BrandedError = brand<CustomError, 'BrandedError'>(error)

      expect(branded instanceof CustomError).toBe(true)
      expect(branded instanceof Error).toBe(true)
    })

    it.concurrent('branded types work with Array.isArray', () => {
      type Items = Brand<number[], 'Items'>
      const items: Items = brand<number[], 'Items'>([1, 2, 3])

      expect(Array.isArray(items)).toBe(true)
    })

    it.concurrent('branded types work with JSON serialization', () => {
      type JsonData = Brand<{name: string; value: number}, 'JsonData'>
      const data: JsonData = brand<{name: string; value: number}, 'JsonData'>({
        name: 'test',
        value: 42,
      })

      const serialized = JSON.stringify(data)
      expect(serialized).toBe('{"name":"test","value":42}')

      const parsed = JSON.parse(serialized) as {name: string; value: number}
      expect(parsed.name).toBe('test')
      expect(parsed.value).toBe(42)
    })

    it.concurrent('branded types work with spread operator', () => {
      type UserData = Brand<{id: string; name: string}, 'UserData'>
      const user: UserData = brand<{id: string; name: string}, 'UserData'>({
        id: 'u1',
        name: 'Alice',
      })

      const extended = {...user, email: 'alice@example.com'}
      expect(extended.id).toBe('u1')
      expect(extended.name).toBe('Alice')
      expect(extended.email).toBe('alice@example.com')
    })

    it.concurrent('branded types work with destructuring', () => {
      type Point = Brand<{x: number; y: number}, 'Point'>
      const point: Point = brand<{x: number; y: number}, 'Point'>({x: 10, y: 20})

      const {x, y} = point
      expect(x).toBe(10)
      expect(y).toBe(20)
    })
  })

  describe('practical use cases', () => {
    it.concurrent('database ID type safety', () => {
      type UserId = Brand<string, 'UserId'>
      type PostId = Brand<string, 'PostId'>
      type CommentId = Brand<string, 'CommentId'>

      const createUserId = (id: string): UserId => brand<string, 'UserId'>(id)
      const createPostId = (id: string): PostId => brand<string, 'PostId'>(id)
      const createCommentId = (id: string): CommentId => brand<string, 'CommentId'>(id)

      const userId = createUserId('user-1')
      const postId = createPostId('post-1')
      const commentId = createCommentId('comment-1')

      // Simulating database operations with type-safe IDs
      const fetchUser = (id: UserId): {id: UserId; name: string} => ({
        id,
        name: 'Test User',
      })

      const fetchPost = (id: PostId): {id: PostId; title: string} => ({
        id,
        title: 'Test Post',
      })

      const user = fetchUser(userId)
      const post = fetchPost(postId)

      expect(user.id).toBe('user-1')
      expect(post.id).toBe('post-1')
      expect(commentId).toBe('comment-1')
    })

    it.concurrent('validated input branding pattern', () => {
      type ValidEmail = Brand<string, 'ValidEmail'>
      type ValidPhone = Brand<string, 'ValidPhone'>

      const validateEmail = (input: string): ValidEmail | null => {
        const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
        return emailRegex.test(input) ? brand<string, 'ValidEmail'>(input) : null
      }

      const validatePhone = (input: string): ValidPhone | null => {
        const phoneRegex = /^\+?\d{10,15}$/
        return phoneRegex.test(input) ? brand<string, 'ValidPhone'>(input) : null
      }

      expect(validateEmail('test@example.com')).toBe('test@example.com')
      expect(validateEmail('invalid')).toBeNull()
      expect(validatePhone('+1234567890')).toBe('+1234567890')
      expect(validatePhone('short')).toBeNull()
    })

    it.concurrent('unit type safety (metrics example)', () => {
      type Meters = Brand<number, 'Meters'>
      type Kilometers = Brand<number, 'Kilometers'>
      type Miles = Brand<number, 'Miles'>

      const metersToKilometers = (m: Meters): Kilometers => {
        return brand<number, 'Kilometers'>(unbrand(m) / 1000)
      }

      const kilometersToMiles = (km: Kilometers): Miles => {
        return brand<number, 'Miles'>(unbrand(km) * 0.621_371)
      }

      const distance: Meters = brand<number, 'Meters'>(5000)
      const km = metersToKilometers(distance)
      const miles = kilometersToMiles(km)

      expect(unbrand(km)).toBe(5)
      expect(unbrand(miles)).toBeCloseTo(3.106_855, 3)
    })

    it.concurrent('currency type safety', () => {
      type USD = Brand<number, 'USD'>
      type EUR = Brand<number, 'EUR'>

      const usdToEur = (usd: USD, rate: number): EUR => {
        return brand<number, 'EUR'>(unbrand(usd) * rate)
      }

      const price: USD = brand<number, 'USD'>(100)
      const euroPrice = usdToEur(price, 0.85)

      expect(unbrand(euroPrice)).toBe(85)
    })
  })
})
