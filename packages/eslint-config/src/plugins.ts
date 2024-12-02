import type {Awaitable} from 'eslint-flat-config-utils'

/* #__NO_SIDE_EFFECTS__ */
export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return 'default' in resolved ? interopDefault(resolved.default) : resolved
}

// @ts-expect-error - No types
export {default as eslintComments} from '@eslint-community/eslint-plugin-eslint-comments'
export {default as importX} from 'eslint-plugin-import-x'
export {default as jsdoc} from 'eslint-plugin-jsdoc'
export {default as perfectionist} from 'eslint-plugin-perfectionist'
export {default as unusedImports} from 'eslint-plugin-unused-imports'
