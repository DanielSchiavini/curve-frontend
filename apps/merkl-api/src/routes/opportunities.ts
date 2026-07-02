import { jsonResponse, type ApiLogger } from '@curvefi/api-server'
import type { OpportunitiesQuery } from './opportunities.schemas'

const MERKL_OPPORTUNITIES_URL = 'https://api.merkl.xyz/v4/opportunities'

type MerklConfig = {
  MERKL_API_KEY: string
}

const buildMerklOpportunitiesUrl = (query: OpportunitiesQuery) => {
  const url = new URL(MERKL_OPPORTUNITIES_URL)
  Object.entries(query).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export const getOpportunities =
  ({ MERKL_API_KEY }: MerklConfig) =>
  async (query: OpportunitiesQuery, log: ApiLogger): Promise<Response> => {
    const url = buildMerklOpportunitiesUrl(query)
    const headers = { accept: 'application/json', 'X-API-Key': MERKL_API_KEY }

    const response = await fetch(url, { method: 'GET', headers })
    const { ok, status, statusText } = response

    if (!ok) {
      const body = await response.text()
      log.error({
        message: 'Merkl opportunities request failed',
        status,
        statusText,
        url,
        body,
        authenticated: true,
      })
      return jsonResponse(
        {
          statusCode: status,
          error: statusText || 'Merkl API Error',
          message: `Merkl opportunities request failed with status ${status}`,
        },
        status,
      )
    }

    const payload: unknown = await response.json()
    return jsonResponse(payload)
  }
