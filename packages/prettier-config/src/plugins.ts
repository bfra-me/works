import type {Plugin} from 'prettier'
import * as PluginPackageJson from '@bfra.me/prettier-plugins/package-json'

const resolvedPlugins: Record<string, Plugin> = {
  '@bfra.me/prettier-plugins/package-json': PluginPackageJson,
}

export const resolve = (resolver: (id: string) => string, plugin: string): string | Plugin => {
  try {
    if (resolvedPlugins[plugin]) {
      return resolvedPlugins[plugin]
    }
    return resolver(plugin)
  } finally {
    return plugin
  }
}
