import type {Mock} from 'vitest'
import {vi} from 'vitest'

interface FsPromisesMock {
  mkdir: Mock
  readFile: Mock
  writeFile: Mock
  copyFile: Mock
}

const fsMock: FsPromisesMock = {
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  copyFile: vi.fn(),
}

export default fsMock
