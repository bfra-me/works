import type {Plugin} from 'prettier'

export type InteropDefault<T> = T extends {default: infer U} ? U : T

function interopDefault<T>(m: T): InteropDefault<T> {
  return (m as any).default || m
}

import {default as pluginPackageJson} from '@bfra.me/prettier-plugins/package-json'
const resolvedPlugins: Record<string, Plugin> = {
  '@bfra.me/prettier-plugins/package-json': interopDefault(pluginPackageJson),
}

export const resolve = <T extends Plugin>(
  resolver: (id: string) => string,
  plugin: string,
): string | T => {
  try {
    if (resolvedPlugins[plugin]) {
      return resolvedPlugins[plugin] as unknown as T
    }
    return resolver(plugin)
  } finally {
    return plugin
  }
}
