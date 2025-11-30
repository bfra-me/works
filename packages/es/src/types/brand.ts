declare const BrandSymbol: unique symbol

/**
 * A branded type that adds a compile-time tag to a base type.
 * Values of Brand<T, B> are assignable to T but not vice versa.
 */
export type Brand<T, B extends string> = T & {readonly [BrandSymbol]: B}

/**
 * An opaque type that completely hides the underlying type.
 * More restrictive than Brand - the base type is not accessible.
 */
export type Opaque<T, B extends string> = T & {readonly [BrandSymbol]: B}

/**
 * A string that is guaranteed to be non-empty.
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>

/**
 * A number that is guaranteed to be a positive integer.
 */
export type PositiveInteger = Brand<number, 'PositiveInteger'>

/**
 * Brands a value with the specified brand type.
 * This is a compile-time operation and does no runtime validation.
 *
 * @param value - The value to brand
 * @returns The branded value
 */
export function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>
}

/**
 * Removes the brand from a branded value, returning the base type.
 *
 * @param value - The branded value
 * @returns The unbranded value
 */
export function unbrand<T>(value: Brand<T, string>): T {
  return value as T
}
