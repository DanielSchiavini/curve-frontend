import Typography from '@mui/material/Typography'
import type { Meta, StoryObj } from '@storybook/react'
import { Metric, SIZES, ALIGNMENTS } from '../Metric'

const meta: Meta<typeof Metric> = {
  title: 'UI Kit/Widgets/Metric',
  component: Metric,
  argTypes: {
    size: {
      control: 'select',
      options: SIZES,
      description: 'The size of the component',
    },
    alignment: {
      control: 'select',
      options: ALIGNMENTS,
      description: 'The alignment of the component',
    },
    label: {
      control: 'text',
      description: 'The label on top of the value describing it',
    },
    labelTooltip: {
      control: 'text',
      description: 'Optional tooltip shown next to the label',
    },
    valueTooltip: {
      control: 'text',
      description: 'Optional tooltip shown when hovering the metric value',
    },
    value: {
      control: 'number',
      description: 'The value of the component',
    },
    valueOptions: {
      control: 'object',
      description: 'Options for formatting the value including decimals, abbreviation, and unit',
    },
    change: {
      control: 'number',
      description: 'Optional value to denote a change in percentage since last time, whenever that may be',
    },
    notional: {
      control: 'object',
      description: 'Optional notional values that gives context or underlying value of the key metric',
    },
  },
  args: {
    size: 'medium',
    alignment: 'start',
    value: 26539422,
    valueOptions: {
      decimals: 1,
      unit: 'dollar',
    },
    label: 'Metrics label',
    copyText: 'Copied metric value',
  },
}

type Story = StoryObj<typeof Metric>
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        component: 'Metric',
        story: 'Simple metric widget showing a dollar value with no special features',
      },
    },
  },
}

export const Percentage: Story = {
  args: {
    value: 1337.42,
    valueOptions: {
      decimals: 2,
      unit: 'percentage',
    },
  },
}

export const Tooltip: Story = {
  args: {
    labelTooltip: { title: "Alu's future portfolio value", body: <Typography variant="headingXxl">ZERO</Typography> },
  },
}

export const LargeCenter: Story = {
  args: {
    size: 'large',
    alignment: 'center',
    change: -5,
  },
}

export const ExtraLargeRight: Story = {
  args: {
    size: 'extraLarge',
    alignment: 'end',
    change: 5,
  },
}

export const Loading: Story = {
  args: {
    loading: true,
  },
}

export const Notional: Story = {
  args: {
    notional: {
      value: 50012345.345353,
      decimals: 2,
      unit: { symbol: ' ETH', position: 'suffix', abbreviate: true },
    },
  },
}

export const Notionals: Story = {
  args: {
    value: 650450,
    valueOptions: { unit: 'dollar' },
    label: 'Collateral to recover',
    size: 'large',
    alignment: 'center',
    notional: [
      {
        value: 26539422,
        decimals: 0,
        unit: { symbol: ' ETH', position: 'suffix', abbreviate: false },
      },
      {
        value: 12450,
        decimals: 2,
        unit: { symbol: ' crvUSD', position: 'suffix', abbreviate: true },
      },
    ],
  },
}

export const CustomUnit: Story = {
  args: {
    valueOptions: {
      unit: {
        symbol: '¥',
        position: 'prefix',
        abbreviate: true,
      },
    },
    change: 0,
  },
}

export const NotAvailable: Story = {
  args: {
    value: null,
    label: 'Metric with N/A Value',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the Metric component when the value is not available (e.g., null, undefined, "", false, NaN).',
      },
    },
  },
}

export default meta
