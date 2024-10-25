import type {LiteralUnion} from 'type-fest'
import type {PluginSpec} from './plugin-spec.d.ts'
import type {SemanticReleasePlugins} from './plugin/semantic-release.d.ts'

/**
 This is a special exported interface for other packages to declare
 additional types that should bail out for eslint rules. For example
 `semantic-release-license` can declare it like so in its `d.ts`:

 ```ts
 declare module '@bfra-me/semantic-release' {
   export interface CustomPluginConfig {
     /**
      The path to your license path.

      \@see [Options](https://github.com/cbhq/semantic-release-license/tree/latest#options)
      *\/
     'semantic-release-license': {
       license: {
         path?: string;
       }
     }
   }
 }
 ```
 */
export interface CustomPluginConfig {}

type WrapPlugin<T extends {[key: string]: any}> = {
  [K in keyof T]: T[K] extends PluginSpec ? T[K] : PluginSpec<[K, T[K]]>
}

type CustomPlugins = WrapPlugin<CustomPluginConfig>

export interface KnownPlugins extends CustomPlugins, SemanticReleasePlugins {}

// Extract the TConfig type from a PluginNameAndConfig
export type PluginConfig<TSpec extends PluginSpec> = TSpec extends [string, infer TConfig]
  ? TConfig
  : never

export type PluginName = LiteralUnion<keyof KnownPlugins, string>

export type Plugin<TLookup extends any = PluginName> = TLookup extends keyof KnownPlugins
  ? PluginSpec<[TLookup, PluginConfig<KnownPlugins[TLookup]>]>
  : TLookup extends string
    ? PluginSpec<[TLookup, {[key: string]: unknown}]>
    : PluginSpec<TLookup>
