import { createServer as createNodeServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { Hono } from 'hono'
import { z } from 'zod/v4'

type ApiServerEnv = Partial<
  Record<'HOST' | 'PORT' | 'LOG_LEVEL' | 'NODE_ENV' | 'SERVICE_NAME' | 'npm_package_version', string | undefined>
>

export type ApiServerBindings = ApiServerEnv & Record<string, string | undefined>

export type ApiLogger = {
  level: string
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  fatal: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  trace: (...args: unknown[]) => void
  silent: (...args: unknown[]) => void
  child: () => ApiLogger
}

const createConsoleLogFn =
  (log: (...data: unknown[]) => void): ApiLogger['info'] =>
  (...args) => {
    log(...args)
  }

export const createConsoleLogger = (env: ApiServerEnv = process.env): ApiLogger => {
  const logger: ApiLogger = {
    level: env.LOG_LEVEL || 'info',
    info: createConsoleLogFn(console.info),
    error: createConsoleLogFn(console.error),
    debug: createConsoleLogFn(console.info),
    fatal: createConsoleLogFn(console.error),
    warn: createConsoleLogFn(console.warn),
    trace: createConsoleLogFn(console.trace),
    silent: createConsoleLogFn(() => undefined),
    child: () => logger,
  }
  return logger
}

const health = (serviceName: string, env: ApiServerEnv) => ({
  status: 'ok',
  service: env.SERVICE_NAME || serviceName,
  environment: env.NODE_ENV || 'production',
  version: env.npm_package_version || '0.0.1',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
})

const jsonReplacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value)

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, jsonReplacer), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8' },
  })

export const validationError = (error: z.ZodError) => ({
  statusCode: 400,
  code: 'FST_ERR_VALIDATION',
  error: 'Bad Request',
  message: z.prettifyError(error),
})

export const createApiServer = <Bindings extends ApiServerBindings = ApiServerBindings>({
  serviceName,
  env = process.env,
}: {
  serviceName: string
  env?: ApiServerEnv
}) => {
  const app = new Hono<{ Bindings: Bindings }>()

  app.get('/health', c => jsonResponse(health(serviceName, { ...env, ...c.env })))
  app.get('/api/health', c => jsonResponse(health(serviceName, { ...env, ...c.env })))

  return app
}

const loadEnvFile = (path?: string) => {
  try {
    process.loadEnvFile(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

export function startDevServer<Bindings extends ApiServerBindings = ApiServerBindings>({
  createServer,
  defaultPort,
  readyMessage,
  failureMessage,
  env = process.env,
  logger = createConsoleLogger(env),
}: {
  createServer: (env?: ApiServerEnv) => Hono<{ Bindings: Bindings }>
  defaultPort: number
  readyMessage: string
  failureMessage: string
  env?: ApiServerEnv
  logger?: ApiLogger
}): void {
  loadEnvFile('.env.local')
  loadEnvFile()

  const { HOST = '127.0.0.1', PORT = `${defaultPort}` } = env
  const app = createServer(env)

  const server = createNodeServer((request, response) => {
    void handleRequest(app, request, response, HOST, PORT)
  })

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
    logger.info({ address }, readyMessage)
  })

  server.on('error', error => {
    logger.error({ err: error }, failureMessage)
    process.exit(1)
  })
}

const handleRequest = async <Bindings extends ApiServerBindings>(
  app: Hono<{ Bindings: Bindings }>,
  request: IncomingMessage,
  response: ServerResponse,
  host: string,
  port: string,
) => {
  if (!request.url) {
    response.writeHead(400)
    response.end('Missing request URL')
    return
  }

  const url = `http://${request.headers.host ?? `${host}:${port}`}${request.url}`
  const honoResponse = await app.fetch(
    new Request(url, { method: request.method, headers: request.headers as HeadersInit }),
  )

  response.writeHead(honoResponse.status, Object.fromEntries(honoResponse.headers))
  response.end(await honoResponse.text())
}
