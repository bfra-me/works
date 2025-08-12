import type {Config} from './config'
import {isPackageExists} from 'local-pkg'

const packageExistsCache = new Map<string, boolean>()
const has = (name: string) => {
  if (!packageExistsCache.has(name)) {
    packageExistsCache.set(name, isPackageExists(name))
  }
  return packageExistsCache.get(name)
}

/**
 * Checks package existence and returns appropriate ESLint config
 * @param names - Array of package names to check
 * @param getConfig - Function to get the primary ESLint config
 * @param fallback - Function to return a config to handle missing packages
 */
export async function requireOf<
  C extends Config[] | Promise<Config[]>,
  D extends Config[] | Promise<Config[]> = C,
>(names: string[], getConfig: () => C, fallback: (missingList: string[]) => D): Promise<C | D> {
  const missingList = names.filter(n => n !== '' && !has(n))
  if (missingList.length) {
    return fallback(missingList)
  }
  return getConfig()
}
