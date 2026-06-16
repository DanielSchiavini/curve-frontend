import { Hono } from 'hono'
import { z } from 'zod/v4'
import { RouteProviders } from '@primitives/router.utils'
import { logger } from './logger'
import { getRoutes } from './routes/routes'
import { ADDRESS_HEX_PATTERN, RoutesPath, type RoutesQuery } from './routes/routes.schemas'

const ADDRESS_REGEX = new RegExp(ADDRESS_HEX_PATTERN)
const WEI_AMOUNT_REGEX = /^\d+$/

const singleton = <T>(schema: z.ZodType<T>) =>
  z
    .array(schema)
    .min(1)
    .max(1)
    .transform(value => value as [T])

const optionalSingleton = <T>(schema: z.ZodType<T>) => singleton(schema).optional()

const querySchema = z
  .object({
    chainId: optionalSingleton(z.coerce.number().int().min(1)).transform(value => value?.[0] ?? 1),
    router: z
      .array(z.enum(RouteProviders))
      .min(1)
      .max(RouteProviders.length)
      .refine(value => new Set(value).size === value.length, 'Duplicate router query parameters are not allowed')
      .optional(),
    tokenIn: singleton(z.string().regex(ADDRESS_REGEX)),
    tokenOut: singleton(z.string().regex(ADDRESS_REGEX)),
    amountIn: optionalSingleton(z.string().regex(WEI_AMOUNT_REGEX)),
    amountOut: optionalSingleton(z.string().regex(WEI_AMOUNT_REGEX)),
    userAddress: optionalSingleton(z.string().regex(ADDRESS_REGEX)).transform(value => value?.[0]),
    slippage: optionalSingleton(z.coerce.number().min(0)).transform(value => value?.[0]),
  })
  .strict()

const health = () => ({
  status: 'ok',
  service: process.env.SERVICE_NAME || 'router-api',
  environment: process.env.NODE_ENV || 'production',
  version: process.env.npm_package_version || '0.0.1',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
})

type SerializedError = {
  name?: string
  message: string
  stack?: string
  cause?: SerializedError
}

const errorDetails = (error: unknown): SerializedError =>
  error instanceof Error ? errorObject(error) : { message: String(error) }

const errorObject = (error: Error): SerializedError => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  cause: errorDetails(error.cause),
})

const validationError = (error: z.ZodError) => ({
  statusCode: 400,
  code: 'FST_ERR_VALIDATION',
  error: 'Bad Request',
  message: z.prettifyError(error),
})

const jsonReplacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value)

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, jsonReplacer), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8' },
  })

export const app = new Hono()

app.get('/health', () => jsonResponse(health()))
app.get('/api/health', () => jsonResponse(health()))

app.get(RoutesPath, async ({ req }) => {
  const start = Date.now()
  const { method, path } = req
  const { data, error, success } = querySchema.safeParse(req.queries())

  if (!success) return jsonResponse(validationError(error), 400)

  try {
    const routes = await getRoutes({ query: data as RoutesQuery, log: logger })
    logger.info({
      message: 'router-api request finished',
      method,
      path,
      statusCode: 200,
      runtimeMs: Date.now() - start,
    })
    return jsonResponse(routes)
  } catch (error: unknown) {
    const response = {
      message: 'router-api request failed',
      method,
      path,
      runtimeMs: Date.now() - start,
      errorDetails: errorDetails(error),
    }
    logger.error({
      ...response,
      error,
    })
    return jsonResponse(response, 500)
  }
})
