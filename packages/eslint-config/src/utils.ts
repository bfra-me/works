import type {Awaitable} from 'eslint-flat-config-utils'

/* #__NO_SIDE_EFFECTS__ */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return typeof resolved === 'object' && resolved !== null && 'default' in resolved
    ? interopDefault(resolved.default as Awaitable<T>)
    : (resolved as T extends {default: infer U} ? U : T)
}
