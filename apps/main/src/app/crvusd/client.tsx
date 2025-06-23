'use client'
import '@/global-extensions'
import delay from 'lodash/delay'
import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { ClientWrapper } from '@/app/ClientWrapper'
import Page from '@/loan/layout'
import { networks, networksIdMapper } from '@/loan/networks'
import useStore from '@/loan/store/useStore'
import type { ChainId, LlamaApi, UrlParams } from '@/loan/types/loan.types'
import { initLlamaApi } from '@/loan/utils/utilsCurvejs'
import { getPath, getRestFullPathname } from '@/loan/utils/utilsRouter'
import { ConnectionProvider, useConnection } from '@ui-kit/features/connect-wallet'
import { useLayoutStore, getPageWidthClassName } from '@ui-kit/features/layout'
import { useUserProfileStore } from '@ui-kit/features/user-profile'
import usePageVisibleInterval from '@ui-kit/hooks/usePageVisibleInterval'
import { REFRESH_INTERVAL } from '@ui-kit/lib/model'

export const App = ({ children }: { children: ReactNode }) => {
  const { network: networkId = 'ethereum' } = useParams() as Partial<UrlParams> // network absent only in root
  const chainId = networksIdMapper[networkId]
  const { lib: curve = null } = useConnection<LlamaApi>()
  const isPageVisible = useLayoutStore((state) => state.isPageVisible)
  const pageWidth = useLayoutStore((state) => state.pageWidth)
  const setLayoutWidth = useLayoutStore((state) => state.setLayoutWidth)
  const setPageVisible = useLayoutStore((state) => state.setPageVisible)
  const setScrollY = useLayoutStore((state) => state.setScrollY)
  const fetchAllStoredUsdRates = useStore((state) => state.usdRates.fetchAllStoredUsdRates)
  const fetchGasInfo = useStore((state) => state.gas.fetchGasInfo)
  const theme = useUserProfileStore((state) => state.theme)
  const hydrate = useStore((s) => s.hydrate)
  const { push } = useRouter()

  const [appLoaded, setAppLoaded] = useState(false)

  const handleResizeListener = useCallback(() => {
    if (window.innerWidth) setLayoutWidth(getPageWidthClassName(window.innerWidth))
  }, [setLayoutWidth])

  useEffect(() => {
    if (!pageWidth) return
    document.body.className = `theme-${theme} ${pageWidth}`.replace(/ +(?= )/g, '').trim()
    document.body.setAttribute('data-theme', theme)
  }, [pageWidth, theme])

  // init app
  useEffect(() => {
    // reset the whole app state, as internal links leave the store with old state but curveJS is not loaded
    useStore.setState(useStore.getInitialState())

    const handleScrollListener = () => setScrollY(window.scrollY)
    const handleVisibilityChange = () => setPageVisible(!document.hidden)

    setAppLoaded(true)
    handleResizeListener()
    handleVisibilityChange()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', () => handleResizeListener())
    window.addEventListener('scroll', () => delay(handleScrollListener, 200))

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', () => handleResizeListener())
      window.removeEventListener('scroll', () => handleScrollListener())
      setAppLoaded(false)
    }
  }, [handleResizeListener, setPageVisible, setScrollY])

  usePageVisibleInterval(
    () => {
      if (isPageVisible && curve) {
        void fetchAllStoredUsdRates(curve)
        void fetchGasInfo(curve)
      }
    },
    REFRESH_INTERVAL['5m'],
    isPageVisible,
  )

  const onChainUnavailable = useCallback(
    ([walletChainId]: [ChainId, ChainId]) => {
      const network = networks[walletChainId]?.id
      if (network) {
        console.warn(`Network switched to ${network}, redirecting...`, location.href)
        push(getPath({ network }, `/${getRestFullPathname()}`))
      }
    },
    [push],
  )

  useEffect(() => {
    if (!networks[chainId]?.showInSelectNetwork) {
      console.warn(`Network not supported ${networkId}, redirecting...`, chainId)
      push(getPath({ network: 'ethereum' }, `/${getRestFullPathname()}`))
    }
  }, [networkId, chainId, push])

  return (
    <ClientWrapper loading={!appLoaded} networks={networks}>
      <ConnectionProvider<ChainId, LlamaApi>
        hydrate={hydrate}
        initLib={initLlamaApi}
        chainId={chainId}
        onChainUnavailable={onChainUnavailable}
      >
        <Page>{children}</Page>
      </ConnectionProvider>
    </ClientWrapper>
  )
}
