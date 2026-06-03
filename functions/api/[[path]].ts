import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { createRouterApiServer } from 'router-api/src/server'
import type { InjectOptions } from 'light-my-request'

const server = createRouterApiServer()

type PagesFunctionContext = {
  request: Request
}

const headersFromInjectedResponse = (headers: Record<string, number | string | string[] | undefined>) => {
  const responseHeaders = new Headers()

  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      value.forEach(item => responseHeaders.append(name, item))
    } else if (value !== undefined) {
      responseHeaders.set(name, String(value))
    }
  }

  return responseHeaders
}

const payloadFromRequest = (request: Request) =>
  request.body === null ? undefined : Readable.fromWeb(request.body as NodeReadableStream<Uint8Array>)

export const onRequest = async ({ request }: PagesFunctionContext) => {
  const start = Date.now()
  await server.ready()
  const { pathname, search } = new URL(request.url)

  const injectOptions: InjectOptions = {
    method: request.method as InjectOptions['method'],
    url: pathname + search,
    headers: Object.fromEntries(request.headers),
    payload: payloadFromRequest(request),
  }

  const response = await server.inject(injectOptions)

  server.log.info({
    message: 'request finished',
    method: request.method,
    path: pathname,
    runtimeMs: Date.now() - start,
  })

  return new Response(response.payload, {
    status: response.statusCode,
    headers: headersFromInjectedResponse(response.headers),
  })
}
