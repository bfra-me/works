export type PluginSpec<TSpec extends unknown[] = unknown[]> = TSpec extends [
  infer TName,
  (infer TConfig)?,
]
  ? TName | [TName, TConfig]
  : never
