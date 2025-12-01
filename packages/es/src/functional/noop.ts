/**
 * A function that does nothing.
 * Useful as a default callback or placeholder.
 *
 * @example
 * ```ts
 * element.addEventListener('click', noop)
 * const callback = options.onComplete ?? noop
 * ```
 */
export function noop(): void {}

/**
 * An async function that does nothing.
 * Useful as a default async callback or placeholder.
 *
 * @example
 * ```ts
 * const onReady = options.onReady ?? noopAsync
 * await onReady()
 * ```
 */
export async function noopAsync(): Promise<void> {}
