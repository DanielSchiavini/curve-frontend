import { NETWORK_CONSTANTS } from '@curvefi/api/lib/constants/network_constants.js'
import { assert } from '@primitives/objects.utils'
import { isRpcChainId, RPC } from '@primitives/rpc'
import type { RouterApiEnv } from '../runtime-env'
import type { CurveJS } from './curvejs'

/**
 * Resolve the RPC URL for a given chain ID from environment variables.
 * Looks for an environment variable named `RPC_URL_{SANITIZED_ID}`.
 * If not found, uses the provided fallback URL.
 * Throws an error if neither is available.
 */
function rpcEnvKey(id: string): `RPC_URL_${string}` {
  const sanitizedId = id
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
  return `RPC_URL_${sanitizedId}`
}

function resolveEnv(id: string, fallback: string, env: RouterApiEnv): string {
  const envKey = rpcEnvKey(id)
  return assert(
    env[envKey]?.trim() ?? fallback,
    `Missing RPC URL for chain ${id}. Add it to environment variable: "${envKey}"`,
  )
}

function fallbackRpcUrl(chainId: number, id: string): string {
  return assert(
    isRpcChainId(chainId) && RPC[chainId][0],
    `Missing fallback RPC URL for chain ${id} (${chainId}). Add it to @primitives/rpc.`,
  )
}

/**
 * Resolve the RPC URL and network ID for a given chain ID using CurveJS.
 */
export async function resolveRpc(
  chainId: number,
  curve: CurveJS,
  env: RouterApiEnv,
): Promise<{ id: string; url: string }> {
  if (chainId in NETWORK_CONSTANTS) {
    const id = (NETWORK_CONSTANTS[chainId] as { NAME: string }).NAME
    return { id, url: resolveEnv(id, fallbackRpcUrl(chainId, id), env) }
  }
  const liteNetworks = await curve.getCurveLiteNetworks() // note: this is already memoized inside curvejs
  const { id, rpcUrl } = assert(
    liteNetworks.find(n => n.chainId === chainId),
    `Unsupported chain ${chainId}`,
  )
  return { id, url: resolveEnv(id, rpcUrl, env) }
}
