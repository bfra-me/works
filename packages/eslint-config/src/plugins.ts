import type {Awaitable} from './types'

export async function interopDefault<T>(
  m: Awaitable<T>,
): Promise<T extends {default: infer U} ? U : T> {
  const resolved = await m
  return (resolved as any).default || resolved
}

export {default as importX} from 'eslint-plugin-import-x'
export {default as perfectionist} from 'eslint-plugin-perfectionist'
export {default as unusedImports} from 'eslint-plugin-unused-imports'
