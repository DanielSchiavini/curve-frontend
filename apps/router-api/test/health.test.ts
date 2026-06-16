import { describe, expect, it } from 'vitest'
import { app } from '../src/app'

describe('health endpoint', () => {
  it('responds with service metadata', async () => {
    const response = await app.request('/health')
    expect(response.status).toBe(200)

    const payload = (await response.json()) as {
      status: string
      service: string
      environment: string
      version: string
      timestamp: string
      uptime: number
    }
    expect(payload).toMatchObject({
      status: 'ok',
      service: 'router-api',
      environment: 'test',
      version: process.env.npm_package_version || '0.0.1',
    })
    expect(typeof payload.timestamp).toBe('string')
    expect(typeof payload.uptime).toBe('number')
    expect(payload.timestamp).not.toHaveLength(0)
    expect(payload.uptime).toBeGreaterThanOrEqual(0)
  })
})
