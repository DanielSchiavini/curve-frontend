import { useCallback, useEffect, useImperativeHandle, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { SizesAndSpaces } from '@ui-kit/themes/design/1_sizes_spaces'
import { Balance, type Props as BalanceProps } from './Balance'
import { TradingSlider } from './TradingSlider'

const { Spacing, FontSize, FontWeight, Sizing } = SizesAndSpaces

// Disallow negative values. We used to clamp max balance too but it's too annoying UX wise.
const clampBalance = (balance: number | string) => Math.max(0, Number(balance))

type HelperMessageProps = {
  message: string | React.ReactNode
  isError: boolean
}

const HelperMessage = ({ message, isError }: HelperMessageProps) => (
  <Box
    sx={{
      backgroundColor: (t) => t.design.Layer[3].Fill,
      paddingBlock: Spacing.sm,
      paddingInlineStart: Spacing.sm,
      ...(isError && { outline: (t) => `1px solid ${t.design.Layer.Feedback.Error}` }),
    }}
  >
    {typeof message === 'string' ? (
      <Typography variant="bodyXsRegular" color={isError ? 'error' : 'textTertiary'}>
        {message}
      </Typography>
    ) : (
      message
    )}
  </Box>
)

type BalanceTextFieldProps = {
  balance: number
  maxBalance?: number
  label?: string
  isError: boolean
  onChange: (balance: number) => void
}

const BalanceTextField = ({ balance, label, isError, onChange }: BalanceTextFieldProps) => (
  <TextField
    type="number"
    placeholder="0.00"
    variant="standard"
    value={balance}
    fullWidth
    slotProps={{
      input: {
        disableUnderline: true,
        sx: {
          backgroundColor: (t) => t.design.Inputs.Large.Default.Fill,
          fontFamily: (t) => t.typography.highlightXl.fontFamily,
          fontSize: FontSize.xl,
          fontWeight: FontWeight.Bold,
          color: (t) => (isError ? t.design.Layer.Feedback.Error : t.design.Text.TextColors.Primary),
          // Sadly there's no standardized CSS method to remove the number input spin buttons.
          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            display: 'none',
          },
        },
      },
    }}
    /**
     * Select all content when clicked.
     * This prevents unintended behavior when users click on the input field.
     * For example, if the field contains "5000" and a user clicks on the left
     * to type "4", it would become "45000" instead of the likely intended "4".
     */
    onFocus={(e) => (e.target as HTMLInputElement).select()}
    onChange={(e) => {
      /**
       * We clamp here and not in the onChange handler passed as property, because
       * we need to remove leading zeros from the new balance. We don't want to pass
       * `e.target` as a callback parameter.
       */
      const newBalance = clampBalance(e.target.value)
      e.target.value = String(newBalance) // remove leading zeros

      onChange(newBalance)
    }}
  />
)

export interface LargeTokenInputRef {
  resetBalance: () => void
}

/**
 * Configuration for maximum balance display and input.
 * When provided, enables percentage-based input via the slider.
 *
 * @property {number} [balance] - The maximum numerical balance available for this input.
 * @property {number} [notionalValue] - The notional value (e.g., in USD) of the maximum balance.
 * @property {string} [symbol] - The token symbol (e.g., 'ETH').
 * @property {boolean} [showBalance=true] - Whether to display the balance component.
 *                                        When true, shows the token balance and notional value.
 *                                        When false, hides the balance display.
 * @property {boolean} [showSlider=true] - Whether to display the percentage slider.
 *                                       When true, shows the slider for percentage-based input.
 *                                       When false, hides the slider but still allows direct input.
 */
type MaxBalanceProps = Partial<Pick<BalanceProps, 'balance' | 'notionalValue' | 'symbol'>> & {
  showBalance?: boolean
  showSlider?: boolean
}

type Props = {
  ref?: React.Ref<LargeTokenInputRef>

  /**
   * The token selector UI element to be rendered.
   *
   * We've chosen to use React.ReactNode here to prevent coupling the relatively simple
   * LargeTokenInput component with the more complex SelectToken feature. This approach provides better composability,
   * allowing you to:
   *
   * 1. Slot in any token selector implementation
   * 2. Handle the callbacks of the token selector in the parent component
   * 3. Feed props back to LargeTokenInput via its properties
   *
   * See the storybook for simple implementation examples of LargeTokenInput.
   *
   * Note: We'll likely create a new 'feature' component that combines this LargeTokenInput component with
   * a token selector and other required app interactions.
   */
  tokenSelector: React.ReactNode

  /**
   * Maximum balance configuration for the input.
   * {@link MaxBalanceProps}
   */
  maxBalance?: MaxBalanceProps

  /**
   * Optional message to display below the input, called the 'helper message'.
   * Can also be used for displaying an error message.
   * Can be a string or a ReactNode for greater message customization and styling.
   */
  message?: string | React.ReactNode

  /** Optional label explaining what the input is all about. */
  label?: string

  /**
   * Whether the input is in an error state.
   * @default false
   */
  isError?: boolean

  /**
   * Number of decimal places to round balance values to when calculating from percentage.
   * @default 4
   */
  balanceDecimals?: number

  /**
   * Callback function triggered when the balance changes.
   * @param balance The new balance value
   */
  onBalance: (balance: number) => void
}

export const LargeTokenInput = ({
  ref,
  tokenSelector,
  maxBalance,
  message,
  label,
  isError = false,
  balanceDecimals = 4,
  onBalance,
}: Props) => {
  const [percentage, setPercentage] = useState(0)
  const [balance, setBalance] = useState(0)

  // Set defaults for showSlider and showBalance to true if maxBalance is provided
  const showSlider = maxBalance && maxBalance.showSlider !== false
  const showBalance = maxBalance && maxBalance.showBalance !== false
  const showMaxBalance = showSlider || showBalance

  const handlePercentageChange = useCallback(
    (newPercentage: number) => {
      if (!maxBalance?.balance) return

      let newBalance = (maxBalance.balance * newPercentage) / 100
      if (balanceDecimals != null) {
        newBalance = Number(newBalance.toFixed(balanceDecimals))
      }

      setPercentage(newPercentage)
      setBalance(newBalance)
      onBalance(newBalance)
    },
    [maxBalance, balanceDecimals, onBalance],
  )

  const handleBalanceChange = useCallback(
    (newBalance: number) => {
      setBalance(newBalance)
      onBalance(newBalance)

      if (maxBalance?.balance) {
        // Calculate percentage based on new balance and round to 2 decimal places
        const calculatedPercentage = (newBalance / maxBalance.balance) * 100
        const newPercentage = Math.min(Math.round(calculatedPercentage * 100) / 100, 100)
        setPercentage(newPercentage)
      }
    },
    [maxBalance, onBalance],
  )

  /**
   * When maxBalance changes, adjust the slider and balance values accordingly
   *
   * This ensures:
   * 1. The current balance remains valid relative to the new max
   * 2. The slider percentage accurately reflects the balance/maxBalance ratio
   */
  useEffect(() => {
    handleBalanceChange(clampBalance(balance))

    /**
     * Changing the percentage changes the balance, which in turn triggers this useEffect,
     * which in turn changes the percentage again. While I am using the current balance,
     * I really only care about triggering it when maxBalance changes.  *
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxBalance])

  const resetBalance = useCallback(() => {
    setPercentage(0)
    setBalance(0)
    onBalance(0)
  }, [onBalance])

  // Expose reset balance function for parent user to reset both balance and percentage, without lifting up state.
  useImperativeHandle(ref, () => ({ resetBalance }), [resetBalance])

  return (
    <Stack
      gap={Spacing.xs}
      sx={{
        backgroundColor: (t) => t.design.Inputs.Large.Default.Fill,
        padding: Spacing.md,
        outline: isError ? (t) => `1px solid ${t.design.Layer.Feedback.Error}` : 'none',
      }}
    >
      <Stack gap={Spacing.xs}>
        {/** First row is an optional label describing the input */}
        {label && (
          <Typography variant="bodyXsRegular" color="textSecondary">
            {label}
          </Typography>
        )}

        {/** Second row containing the token selector and balance input text */}
        <Stack direction="row" alignItems="end" gap={Spacing.md}>
          <BalanceTextField
            balance={balance}
            maxBalance={maxBalance?.balance}
            isError={isError}
            onChange={handleBalanceChange}
          />

          {tokenSelector}
        </Stack>

        {/** Third row containing (max) balance and sliders */}
        {showMaxBalance && (
          <Stack
            direction="row"
            gap={Spacing.sm}
            sx={{
              minHeight: Sizing.sm, // same height as slider so height doesn't jump if maxBalance becomes available
              zIndex: 1, // required otherwise the slider background and border don't show up
            }}
          >
            {showBalance && (
              <Balance
                symbol={maxBalance.symbol ?? ''}
                balance={maxBalance.balance}
                notionalValue={maxBalance.notionalValue}
                max={maxBalance ? 'button' : 'off'}
                onMax={() => handlePercentageChange(100)}
                // Stretch the balance component if there's no slider so the max button can reach the end
                sx={{ ...(!showSlider && { flexGrow: 1 }) }}
              />
            )}

            {showSlider && (
              <TradingSlider
                percentage={percentage}
                onPercentageChange={handlePercentageChange}
                onPercentageCommitted={handlePercentageChange}
              />
            )}
          </Stack>
        )}
      </Stack>

      {/** Fourth row containing optional helper (or error) message */}
      {message && <HelperMessage message={message} isError={isError} />}
    </Stack>
  )
}
