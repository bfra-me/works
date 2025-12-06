/**
 * Shared constants for validation across @bfra.me/create
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * Consolidates validation constants to eliminate DRY violations
 * between type-guards.ts and validation.ts.
 */

/**
 * Reserved names that cannot be used as package names
 */
export const RESERVED_PACKAGE_NAMES = [
  'node_modules',
  'favicon.ico',
  'package.json',
  'readme.md',
  'changelog.md',
  'license',
  'mit',
  'apache',
  'gpl',
  'bsd',
] as const

export type ReservedPackageName = (typeof RESERVED_PACKAGE_NAMES)[number]

/**
 * Built-in Node.js modules that cannot be used as package names
 */
export const BUILTIN_NODE_MODULES = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
] as const

export type BuiltinNodeModule = (typeof BUILTIN_NODE_MODULES)[number]

/**
 * Check if a name is reserved
 */
export function isReservedName(name: string): boolean {
  return (RESERVED_PACKAGE_NAMES as readonly string[]).includes(name.toLowerCase())
}

/**
 * Check if a name conflicts with Node.js built-in modules
 */
export function isBuiltinModule(name: string): boolean {
  return (BUILTIN_NODE_MODULES as readonly string[]).includes(name)
}
