/**
 * Optional structured console logger for page objects and helpers.
 * Default min level is **warn** so Smart Reporter / CI stay quiet unless you opt in.
 *
 * Set `LOG_LEVEL=debug|info|warn|error` (default **warn**).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function minLevel(): LogLevel {
  const v = (process.env['LOG_LEVEL'] ?? 'warn').toLowerCase() as LogLevel;
  return v in PRIORITY ? v : 'warn';
}

export class Logger {
  private readonly floor: LogLevel;

  constructor(private readonly context: string) {
    this.floor = minLevel();
  }

  private ok(level: LogLevel): boolean {
    return PRIORITY[level] >= PRIORITY[this.floor];
  }

  debug(message: string, data?: unknown): void {
    if (!this.ok('debug')) return;
    console.debug(`[DEBUG] [${this.context}] ${message}`, data !== undefined ? data : '');
  }

  info(message: string, data?: unknown): void {
    if (!this.ok('info')) return;
    console.info(`[INFO] [${this.context}] ${message}`, data !== undefined ? data : '');
  }

  warn(message: string, data?: unknown): void {
    if (!this.ok('warn')) return;
    console.warn(`[WARN] [${this.context}] ${message}`, data !== undefined ? data : '');
  }

  error(message: string, err?: unknown): void {
    if (!this.ok('error')) return;
    console.error(`[ERROR] [${this.context}] ${message}`, err);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
