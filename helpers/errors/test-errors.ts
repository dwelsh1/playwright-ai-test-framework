/**
 * Typed errors for page navigation and API layers.
 * Throw these from helpers when you want clearer messages; pass `{ cause }` to preserve Playwright's stack.
 */

export class PageLoadError extends Error {
  constructor(url: string, options?: { timeoutMs?: number; cause?: unknown }) {
    const t = options?.timeoutMs != null ? ` within ${options.timeoutMs}ms` : '';
    super(
      `Page failed to load${t}: ${url}`,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'PageLoadError';
  }
}

export class NavigationError extends Error {
  constructor(
    public readonly actualUrl: string,
    public readonly expected: string | RegExp,
    options?: { cause?: unknown },
  ) {
    super(
      `Navigation assertion failed — URL "${actualUrl}" did not match expected: ${String(expected)}`,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'NavigationError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly url?: string,
    options?: { cause?: unknown },
  ) {
    const where = url ? ` [${url}]` : '';
    super(
      `API error (HTTP ${statusCode})${where}: ${message}`,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'ApiError';
  }
}

export class ElementNotFoundError extends Error {
  constructor(descriptor: string, timeoutMs?: number, options?: { cause?: unknown }) {
    const suffix = timeoutMs != null ? ` (waited ${timeoutMs}ms)` : '';
    super(
      `Element not found: ${descriptor}${suffix}`,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'ElementNotFoundError';
  }
}

export class TestDataError extends Error {
  constructor(field: string) {
    super(`Required test data or environment variable is missing: "${field}"`);
    this.name = 'TestDataError';
  }
}
