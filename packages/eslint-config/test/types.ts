import type {Linter} from 'eslint'
import type {Config} from '../src'

const assertCompatibility = (
  linterConfig: Linter.Config,
  config: Config,
): [Linter.Config, Config] => [linterConfig, config]

assertCompatibility({} as Config, {} as Linter.Config)
