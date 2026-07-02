import { z } from 'zod/v4'
import {
  createApiServer,
  createConsoleLogger,
  jsonResponse,
  validationError,
  type ApiServerBindings,
} from '@curvefi/api-server'
import { getOpportunities } from './routes/opportunities'
import { OpportunitiesPath } from './routes/opportunities.schemas'

type MerklApiEnv = ApiServerBindings & {
  MERKL_API_KEY?: string
}

const querySchema = z
  .object({
    mainProtocolId: z.enum(['curve', 'llamalend']).optional(),
    test: z.coerce.boolean().optional(),
    status: z.enum(['LIVE']).optional(),
    action: z.string().min(1).optional(),
    items: z.coerce.number().int().min(1).optional(),
    page: z.coerce.number().int().min(0).optional(),
  })
  .strict()

export const createMerklServer = (env = process.env) => {
  const { MERKL_API_KEY } = env

  if (!MERKL_API_KEY) throw new Error('Missing required environment variable MERKL_API_KEY')

  const logger = createConsoleLogger(env)
  const app = createApiServer<MerklApiEnv>({ serviceName: 'merkl-api', env })

  app.get(OpportunitiesPath, ({ req }) => {
    const { data, error, success } = querySchema.safeParse(req.query())

    if (!success) return jsonResponse(validationError(error), 400)

    return getOpportunities({ MERKL_API_KEY })(data, logger)
  })

  return app
}
