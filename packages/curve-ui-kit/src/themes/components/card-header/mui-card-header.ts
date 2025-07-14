/// <reference types="./mui-card-header.d.ts" />
import type { Components, TypographyVariantsOptions } from '@mui/material/styles'
import { DesignSystem } from '@ui-kit/themes/design'
import { SizesAndSpaces } from '@ui-kit/themes/design/1_sizes_spaces'

const { Sizing, Spacing, ButtonSize } = SizesAndSpaces

export const defineMuiCardHeader = (
  design: DesignSystem,
  typography: TypographyVariantsOptions,
): Components['MuiCardHeader'] => ({
  styleOverrides: {
    root: {
      padding: `${Spacing.lg.desktop} ${Spacing.md.desktop} ${Spacing.sm.desktop}`,
      borderBottom: `1px solid ${design.Layer[3].Outline}`,
      minHeight: `calc(${ButtonSize.lg} + 1px)`, // 1px to account for border
      variants: [
        {
          props: { size: 'small' },
          style: {
            minHeight: 'auto',
            maxHeight: Sizing.md.desktop,
            padding: `${Spacing.md.desktop} ${Spacing.md.desktop} ${Spacing.sm.desktop}`,
          },
        },
      ],
    },
    action: { alignContent: 'center', alignSelf: 'center', margin: 0 },
    title: {
      ...typography.headingSBold,
      variants: [
        {
          props: { size: 'small' },
          style: {
            ...typography.headingXsBold,
          },
        },
      ],
    },
  },
})
