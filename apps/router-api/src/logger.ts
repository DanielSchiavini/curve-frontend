export type RouterLogFn = (...args: unknown[]) => void

export type RouterLogger = {
  level: string
  info: RouterLogFn
  error: RouterLogFn
  debug: RouterLogFn
  fatal: RouterLogFn
  warn: RouterLogFn
  trace: RouterLogFn
  silent: RouterLogFn
  child: () => RouterLogger
}

const createConsoleLogFn =
  (log: (...data: unknown[]) => void): RouterLogFn =>
  (...args) => {
    log(...args)
  }

export const logger: RouterLogger = {
  level: process.env.LOG_LEVEL || 'info',
  info: createConsoleLogFn(console.info),
  error: createConsoleLogFn(console.error),
  debug: createConsoleLogFn(console.info),
  fatal: createConsoleLogFn(console.error),
  warn: createConsoleLogFn(console.warn),
  trace: createConsoleLogFn(console.trace),
  silent: createConsoleLogFn(() => undefined),
  child: () => logger,
}
