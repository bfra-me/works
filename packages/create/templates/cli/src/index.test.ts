import {describe, expect, it} from 'vitest'
import {main} from './index'

describe('main', () => {
  it('resolves when no arguments are provided', async () => {
    await expect(main([], {})).resolves.toBeUndefined()
  })

  it('resolves when processing arguments with verbose output', async () => {
    await expect(main(['hello'], {verbose: true})).resolves.toBeUndefined()
  })
})
