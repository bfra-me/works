import DatauriParser from 'datauri/parser'
import formDataToString from 'formdata-to-string'

function objectifyHeaders(headers: []) {
  return Object.fromEntries(headers)
}

export const response = {
  id: 123,
  name: 'Buster',
}

export const responses = {
  all: (url: string, opts: RequestInit) => {
    return {
      uri: new URL(url).pathname,
      headers: Object.fromEntries(opts.headers as unknown as []),
      requestBody: opts.body,
    }
  },

  datauri: (url: string, opts: RequestInit) => {
    const buffer = Buffer.from(opts.body as string, 'hex')
    const parser = new DatauriParser()

    return {
      uri: new URL(url).pathname,
      requestBody: parser.format('.png', buffer).content,
      headers: Object.fromEntries(opts.headers as unknown as []),
    }
  },

  delay: (res: Record<string, unknown> | string, delay: number) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(res), delay)
    })
  },

  headers: (url: string, opts: RequestInit) => {
    // `opts.headers` returns a `HeadersList` object instead of `Headers` as the typing suggests so
    // we need to convert it to an array before converting it to an object.
    return Object.fromEntries(opts.headers as unknown as [])
  },

  multipart: async (url: string, opts: RequestInit) => {
    const headers = objectifyHeaders(opts.headers as unknown as [])
    const payload = await formDataToString(opts.body as FormData)

    return {
      uri: new URL(url).pathname,
      requestBody: payload,
      headers,
      boundary: payload.split('\r\n')[0],
    }
  },

  real: (res: Record<string, unknown> | string) => {
    return () => res
  },

  requestBody: () => {
    return (url: string, opts: RequestInit) => {
      return {
        uri: new URL(url).pathname,
        // eslint-disable-next-line try-catch-failsafe/json-parse
        requestBody: JSON.parse(opts.body as string),
      }
    }
  },

  searchParams: (url: string) => {
    const res = new URL(url)
    return `${res.pathname}${res.search}`
  },

  url: (prop: keyof URL) => {
    return (url: string) => {
      return new URL(url)[prop]
    }
  },
}
