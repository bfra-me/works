import type {Awaitable} from 'eslint-flat-config-utils'
import {fileURLToPath} from 'node:url'
import {isPackageExists} from 'local-pkg'

const scopeUrl = fileURLToPath(new URL('.', import.meta.url))

/* #__NO_SIDE_EFFECTS__ */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return typeof resolved === 'object' && resolved !== null && 'default' in resolved
    ? interopDefault(resolved.default as Awaitable<T>)
    : (resolved as T extends {default: infer U} ? U : T)
}

export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, {paths: [scopeUrl]})
}
