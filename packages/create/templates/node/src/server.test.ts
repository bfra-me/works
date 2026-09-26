import {describe, expect, it} from 'vitest'
import {createServer} from './server'

describe('createServer', () => {
  it('responds with a greeting message', async () => {
    const app = createServer()
    const response = await app.inject({method: 'GET', url: '/'})

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({message: 'Hello from <%= it.name %>!'})
  })
})
