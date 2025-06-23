import { useParams } from 'next/navigation'
import { ReactNode, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { ROUTE } from '@/lend/constants'
import { Header } from '@/lend/layout/Header'
import type { UrlParams } from '@/lend/types/lend.types'
import { getPath } from '@/lend/utils/utilsRouter'
import { useLayoutStore, layoutHeightKeys } from '@ui-kit/features/layout'
import { useLayoutHeight } from '@ui-kit/hooks/useResizeObserver'
import { isChinese, t } from '@ui-kit/lib/i18n'
import { Footer } from '@ui-kit/widgets/Footer'
import { useHeaderHeight } from '@ui-kit/widgets/Header'
import type { NavigationSection } from '@ui-kit/widgets/Header/types'
import { networksIdMapper } from '../networks'

const BaseLayout = ({ children }: { children: ReactNode }) => {
  const globalAlertRef = useRef<HTMLDivElement>(null)
  const params = useParams() as UrlParams
  const { network: networkId } = params
  const layoutHeight = useLayoutStore((state) => state.height)
  const setLayoutHeight = useLayoutStore((state) => state.setLayoutHeight)
  const bannerHeight = useLayoutStore((state) => state.height.globalAlert)
  const minHeight = useMemo(() => layoutHeightKeys.reduce((total, key) => total + layoutHeight[key], 0), [layoutHeight])

  useLayoutHeight(globalAlertRef, 'globalAlert', setLayoutHeight)

  const sections = useMemo(() => getSections(params), [params])
  const chainId = networksIdMapper[networkId]

  return (
    <Container globalAlertHeight={layoutHeight?.globalAlert}>
      <Header chainId={chainId} sections={sections} globalAlertRef={globalAlertRef} networkId={networkId} />
      <Main minHeight={minHeight}>{children}</Main>
      <Footer appName="lend" networkId={networkId} headerHeight={useHeaderHeight(bannerHeight)} />
    </Container>
  )
}

const getSections = ({ network }: UrlParams): NavigationSection[] => [
  {
    title: t`Documentation`,
    links: [
      { href: 'https://news.curve.finance/', label: t`News` },
      { href: 'https://resources.curve.finance/lending/understanding-lending/', label: t`User Resources` },
      { href: 'https://docs.curve.finance', label: t`Developer Resources` },
      { href: getPath({ network }, `${ROUTE.PAGE_DISCLAIMER}?tab=lend`), label: t`Risk Disclaimers` },
      { href: getPath({ network }, ROUTE.PAGE_INTEGRATIONS), label: t`Integrations` },
      { href: 'https://resources.curve.finance/glossary-branding/branding/', label: t`Branding` },
      ...(isChinese() ? [{ href: 'https://www.curve.wiki/', label: t`Wiki` }] : []),
    ],
  },
  {
    title: t`Security`, // audits, bug bounty, dune analytics, curve monitor & crvhub
    links: [
      { href: 'https://docs.curve.finance/references/audits/', label: t`Audits` },
      { href: 'https://docs.curve.finance/security/security/', label: t`Bug Bounty` },
      { href: 'https://dune.com/mrblock_buidl/Curve.fi', label: t`Dune Analytics` },
      { href: 'https://curvemonitor.com', label: t`Curve Monitor` },
      { href: 'https://crvhub.com/', label: t`Crvhub` },
    ],
  },
]

const Main = styled.main<{ minHeight: number }>`
  margin: 0 auto;
  max-width: var(--width);
  min-height: ${({ minHeight }) => `calc(100vh - ${minHeight}px - var(--header-height))`};
  width: 100%;
`

const Container = styled.div<{ globalAlertHeight: number }>`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  min-height: ${({ globalAlertHeight }) => `calc(100vh - ${globalAlertHeight}px)`};
`

export default BaseLayout
