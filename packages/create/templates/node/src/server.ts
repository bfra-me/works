import Fastify from 'fastify'

/**
 * Creates the Fastify server instance for <%= it.name %>.
 */
export function createServer() {
  const app = Fastify()

  app.get('/', async () => ({message: 'Hello from <%= it.name %>!'}))

  return app
}

async function start(): Promise<void> {
  const app = createServer()
  const port = Number(process.env.PORT) || 3000

  try {
    await app.listen({port})
    app.log.info(`Server running on port ${port}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void start()
}
