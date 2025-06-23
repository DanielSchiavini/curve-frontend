import { useParams } from 'next/navigation'
import { ReactNode, useMemo, useRef } from 'react'
import styled from 'styled-components'
import { ROUTE } from '@/loan/constants'
import Header from '@/loan/layout/Header'
import type { NetworkUrlParams, UrlParams } from '@/loan/types/loan.types'
import { getPath } from '@/loan/utils/utilsRouter'
import { useLayoutStore, layoutHeightKeys } from '@ui-kit/features/layout'
import { useLayoutHeight } from '@ui-kit/hooks/useResizeObserver'
import { isChinese, t } from '@ui-kit/lib/i18n'
import { Footer } from '@ui-kit/widgets/Footer'
import { useHeaderHeight } from '@ui-kit/widgets/Header'
import type { NavigationSection } from '@ui-kit/widgets/Header/types'

const BaseLayout = ({ children }: { children: ReactNode }) => {
  const globalAlertRef = useRef<HTMLDivElement>(null)
  const setLayoutHeight = useLayoutStore((state) => state.setLayoutHeight)
  useLayoutHeight(globalAlertRef, 'globalAlert', setLayoutHeight)

  const layoutHeight = useLayoutStore((state) => state.height)
  const bannerHeight = useLayoutStore((state) => state.height.globalAlert)
  const params = useParams() as UrlParams

  const minHeight = useMemo(() => layoutHeightKeys.reduce((total, key) => total + layoutHeight[key], 0), [layoutHeight])

  const sections = useMemo(() => getSections(params), [params])
  return (
    <Container globalAlertHeight={layoutHeight?.globalAlert}>
      <Header sections={sections} globalAlertRef={globalAlertRef} networkId={params.network} />
      <Main minHeight={minHeight}>{children}</Main>
      <Footer appName="crvusd" networkId={params.network} headerHeight={useHeaderHeight(bannerHeight)} />
    </Container>
  )
}

const getSections = ({ network }: NetworkUrlParams): NavigationSection[] => [
  {
    title: t`Documentation`,
    links: [
      { href: 'https://news.curve.finance/', label: t`News` },
      { href: 'https://resources.curve.finance/lending/understanding-lending/', label: t`User Resources` },
      { href: 'https://docs.curve.finance', label: t`Developer Resources` },
      { href: getPath({ network }, `${ROUTE.PAGE_DISCLAIMER}?tab=crvusd`), label: t`Risk Disclaimers` },
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
  min-height: ${({ minHeight }) => `calc(100vh - ${minHeight}px)`};
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
