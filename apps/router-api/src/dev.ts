import { startDevServer } from '@curvefi/api-server'
import { app } from './app'

void startDevServer({
  createServer: () => app,
  defaultPort: 3010,
  readyMessage: 'Router API server ready',
  failureMessage: 'Failed to start Router API server.',
})
