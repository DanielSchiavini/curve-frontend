import { styled } from 'styled-components'

type SpinnerWrapperProps = {
  vSpacing?: number
  minHeight?: string
}

const SpinnerWrapper = styled.div<SpinnerWrapperProps>`
  align-items: center;
  display: flex;
  justify-content: center;
  padding: var(--spacing-${({ vSpacing }) => vSpacing ?? '5'});
  width: 100%;

  ${({ minHeight }) => {
    if (minHeight) {
      return `
        min-height: ${minHeight};
        padding: 0;
      `
    }
  }}

  svg {
    vertical-align: baseline;

    circle:first-of-type {
      stroke: var(--spinner--foreground-color);
    }
    circle:last-of-type {
      stroke: var(--spinner--background-color);
    }
  }
`

export default SpinnerWrapper
