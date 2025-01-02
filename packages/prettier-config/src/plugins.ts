import type {Plugin} from 'prettier'
import * as PluginPackageJson from '@bfra.me/prettier-plugins/package-json'

const resolvedPlugins: Record<string, string | Plugin<any>> = {
  '@bfra.me/prettier-plugins/package-json': PluginPackageJson,
}

export function resolve(resolver: (id: string) => string, plugin: string): string | Plugin<any> {
  try {
    if (!resolvedPlugins[plugin]) {
      const resolved = resolver(plugin)
      resolvedPlugins[plugin] = resolved
    }
    return resolvedPlugins[plugin] ?? plugin
  } catch {
    return plugin
  }
}
