import { type default as curveApi, createCurve } from '@curvefi/api'
import { getPoolFilters } from '@curvefi/prices-api/chains'
import type { RouterLogger } from '../logger'
import type { RouterApiEnv } from '../runtime-env'
import { resolveRpc } from './network-metadata'

export type CurveJS = typeof curveApi
type ChainId = number

const instances: Partial<Record<ChainId, Promise<CurveJS>>> = {}

const FACTORIES = [
  'factory',
  'cryptoFactory',
  'twocryptoFactory',
  'crvUSDFactory',
  'tricryptoFactory',
  'stableNgFactory',
] as const

const ONE_MINUTE = 60000
// Node timers expose unref() so local dev/tests can exit; CF workers do not.
type RefreshTimer = ReturnType<typeof setTimeout> & { unref?: () => void }

/**
 * Fetch pools from all Curve factories and set up periodic refresh for a given CurveJS instance.
 */
async function fetchPools(curve: CurveJS, log: RouterLogger) {
  const factories = FACTORIES.map(key => curve[key])
  const fetchAllPools = async ({ initial = false }: { initial?: boolean } = {}) => {
    try {
      const [poolFilters] = await Promise.all([
        getPoolFilters(),
        ...factories.map(async factory => {
          await factory.fetchPools()
          if ('fetchNewPools' in factory) await factory.fetchNewPools()
        }),
      ])

      curve.router.setBlacklist(
        poolFilters
          .filter(({ chain }) => chain === curve.getNetworkConstants().NETWORK_NAME)
          .map(({ address }) => address.toLowerCase()),
      )
    } catch (e: unknown) {
      log.error({ message: 'Error fetching pools', error: e, chainId: curve.chainId })
      if (initial) throw e // make sure the request fails if fetching pools fails
    } finally {
      const refreshTimer: RefreshTimer = setTimeout(() => void fetchAllPools(), ONE_MINUTE)
      refreshTimer.unref?.()
    }
  }
  await fetchAllPools({ initial: true })
  log.info({ message: 'pools fetched', chainId: curve.chainId })
}

/**
 * Get a Curve.js instance for a specific chain ID, initializing it if necessary.
 * The instance is cached for future use. Automatically fetches and refreshes pool data.
 */
export const loadCurve = (chainId: number, log: RouterLogger, env: RouterApiEnv) => {
  instances[chainId] ??= (async () => {
    const curve = createCurve()
    const { url } = await resolveRpc(chainId, curve, env)
    await curve.init('JsonRpc', { url }, { chainId })
    await fetchPools(curve, log)
    return curve
  })()
  return instances[chainId]
}
