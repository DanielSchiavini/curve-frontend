'use client'
import '@/global-extensions'
import delay from 'lodash/delay'
import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { ClientWrapper } from '@/app/ClientWrapper'
import Page from '@/lend/layout'
import { helpers } from '@/lend/lib/apiLending'
import networks, { networksIdMapper } from '@/lend/networks'
import useStore from '@/lend/store/useStore'
import type { ChainId, UrlParams } from '@/lend/types/lend.types'
import { getPath, getRestFullPathname } from '@/lend/utils/utilsRouter'
import { ConnectionProvider } from '@ui-kit/features/connect-wallet'
import { useLayoutStore, getPageWidthClassName } from '@ui-kit/features/layout'
import { useUserProfileStore } from '@ui-kit/features/user-profile'

export const App = ({ children }: { children: ReactNode }) => {
  const { network: networkId = 'ethereum' } = useParams() as Partial<UrlParams> // network absent only in root
  const chainId = networksIdMapper[networkId]
  const pageWidth = useLayoutStore((state) => state.pageWidth)
  const setLayoutWidth = useLayoutStore((state) => state.setLayoutWidth)
  const setPageVisible = useLayoutStore((state) => state.setPageVisible)
  const setScrollY = useLayoutStore((state) => state.setScrollY)
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
    const handleScroll = () => delay(handleScrollListener, 200)

    setAppLoaded(true)
    handleResizeListener()
    handleVisibilityChange()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleResizeListener)
    window.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', () => handleResizeListener())
      window.removeEventListener('scroll', () => handleScrollListener())
      setAppLoaded(false)
    }
  }, [handleResizeListener, setPageVisible, setScrollY])

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
      <ConnectionProvider
        hydrate={hydrate}
        initLib={helpers.initApi}
        chainId={chainId}
        onChainUnavailable={onChainUnavailable}
      >
        <Page>{children}</Page>
      </ConnectionProvider>
    </ClientWrapper>
  )
}
