import type {Linter} from 'eslint'

import type {Config} from '../src'

// Make sure they are compatible
;((): Linter.Config => ({}) as Config)()
;((): Config => ({}) as Linter.Config)()
