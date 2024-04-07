export type PluginSpec<TSpec extends any[] = any[]> = TSpec extends [infer TName, (infer TConfig)?]
  ? TName | [TName, TConfig]
  : never
