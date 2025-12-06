import {fileURLToPath} from 'node:url'
import {isPackageExists} from 'local-pkg'

const scopeUrl = fileURLToPath(new URL('.', import.meta.url))

export {interopDefault} from '../../es/src/module'

/**
 * Check if a package exists within the eslint-config package scope.
 *
 * @param name - The package name to check
 * @returns True if the package exists within this package's scope
 */
export function isPackageInScope(name: string): boolean {
  return isPackageExists(name, {paths: [scopeUrl]})
}
