export type RouterApiEnv = {
  ENSO_API_KEY?: string
  ENSO_API_URL?: string
  LOG_LEVEL?: string
  NODE_ENV?: string
  ODOS_API_URL?: string
  SERVICE_NAME?: string
  npm_package_version?: string
  [key: `RPC_URL_${string}`]: string | undefined
}
