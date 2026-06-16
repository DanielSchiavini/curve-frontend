import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { app } from './app'
import { logger } from './logger'

process.loadEnvFile()

const { HOST = '127.0.0.1', PORT = 3010 } = process.env

const server = createServer((request, response) => {
  void handleRequest(request, response)
})

const handleRequest = async (request: IncomingMessage, response: ServerResponse) => {
  if (!request.url) {
    response.writeHead(400)
    response.end('Missing request URL')
    return
  }
  const url = `http://${request.headers.host ?? `${HOST}:${PORT}`}${request.url}`
  const honoResponse = await app.fetch(
    new Request(url, { method: request.method, headers: request.headers as HeadersInit }),
  )

  response.writeHead(honoResponse.status, Object.fromEntries(honoResponse.headers))
  response.end(await honoResponse.text())
}

const stopServer = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Received shutdown signal. Closing server.')
  server.close(error => {
    if (error) {
      logger.error({ err: error }, 'Error during server shutdown.')
      process.exit(1)
    }

    logger.info('Server closed successfully.')
    process.exit(0)
  })
}

process.on('SIGINT', stopServer)
process.on('SIGTERM', stopServer)

server.listen(Number(PORT), HOST, () => {
  const address = server.address()
  logger.info({ address }, 'Router API server ready')
})
