import { app } from 'router-api/src/app'
import type { RouterApiEnv } from 'router-api/src/runtime-env'

type PagesFunctionContext = {
  env: RouterApiEnv
  request: Request
}

export const onRequest = async ({ env, request }: PagesFunctionContext) => {
  try {
    return await app.fetch(request, env)
  } catch (error: unknown) {
    console.error('router-api adapter failed', { error, method: request.method, url: request.url })
    return Response.json({ message: 'router-api adapter failed' }, { status: 500 })
  }
}
