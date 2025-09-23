import type {Linter} from 'eslint'
import type {Config} from '../src'

// Make sure they are compatible
// eslint-disable-next-line import-x/newline-after-import
;((): Linter.Config => ({}) as Config)()
;((): Config => ({}) as Linter.Config)()
