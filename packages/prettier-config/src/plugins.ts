import type {Plugin} from 'prettier'
import * as PluginPackageJson from '@bfra.me/prettier-plugins/package-json'

const resolvedPlugins: Record<string, Plugin> = {
  '@bfra.me/prettier-plugins/package-json': PluginPackageJson,
}

export async function resolve(
  resolver: (id: string) => string,
  plugin: string,
): Promise<string | Plugin<any>> {
  try {
    if (!resolvedPlugins[plugin]) {
      const resolved = resolver(plugin)
      const resolvedPlugin = await interopDefault(import(resolved))
      resolvedPlugins[plugin] = resolvedPlugin
    }
    return resolvedPlugins[plugin] ?? plugin
  } catch {
    return plugin
  }
}

async function interopDefault<T>(
  m: T | PromiseLike<T>,
): Promise<T extends {default: infer U} ? U : T> {
  return ((await m) as any).default || (await m)
}
