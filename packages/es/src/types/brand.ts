declare const BrandSymbol: unique symbol

/**
 * Creates nominal typing in TypeScript's structural type system,
 * preventing accidental assignment of structurally-compatible values.
 */
export type Brand<T, B extends string> = T & {readonly [BrandSymbol]: B}

/**
 * Like Brand but semantically indicates the underlying type should be treated as hidden.
 * Use for values where the internal representation is an implementation detail.
 */
export type Opaque<T, B extends string> = T & {readonly [BrandSymbol]: B}

/**
 * Compile-time marker for strings validated as non-empty.
 * Validation must be performed separately before branding.
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>

/**
 * Compile-time marker for numbers validated as positive integers.
 * Validation must be performed separately before branding.
 */
export type PositiveInteger = Brand<number, 'PositiveInteger'>

/**
 * Compile-time marker for paths validated against null bytes and invalid characters.
 * Validation must be performed separately before branding.
 */
export type ValidPath = Brand<string, 'ValidPath'>

/**
 * Compile-time marker for paths validated as absolute (Unix / or Windows drive letter).
 * Validation must be performed separately before branding.
 */
export type AbsolutePath = Brand<string, 'AbsolutePath'>

/**
 * Zero-cost type cast that brands a value after external validation.
 * This is purely a compile-time operation with no runtime overhead.
 *
 * @param value - The value to brand
 * @returns The same value with branded type
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>
 * const userId = brand<string, 'UserId'>('user-123')
 * ```
 */
export function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>
}

/**
 * Zero-cost type cast that removes branding when the raw value is needed.
 * Useful for serialization or passing to external APIs that don't understand branded types.
 *
 * @param value - The branded value to unwrap
 * @returns The underlying value without brand
 *
 * @example
 * ```ts
 * const userId: UserId = brand<string, 'UserId'>('user-123')
 * const rawId: string = unbrand(userId)
 * JSON.stringify({ id: rawId })  // Safe for serialization
 * ```
 */
export function unbrand<T>(value: Brand<T, string>): T {
  return value as T
}
