export type TuttiExternalLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type TuttiExternalLogInput = {
  details?: Record<string, unknown>;
  event: string;
  level?: TuttiExternalLogLevel;
};

export function writeTuttiExternalLog(input: TuttiExternalLogInput): void {
  window.tuttiExternal?.logs?.write?.(input);
}

export function errorDetails(value: unknown): Record<string, unknown> {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }
  if (typeof value === 'string') {
    return { message: value };
  }
  return { message: String(value) };
}

export function installTuttiExternalPageDiagnostics(): void {
  writeTuttiExternalLog({
    event: 'page.loaded',
    level: 'info',
    details: {
      pathname: globalThis.location.pathname,
      search: globalThis.location.search || undefined,
    },
  });

  globalThis.addEventListener('error', (event) => {
    writeTuttiExternalLog({
      event: 'renderer.uncaught_error',
      level: 'error',
      details: {
        ...errorDetails(event.error ?? event.message),
        column: Number.isFinite(event.colno) ? event.colno : undefined,
        filename: event.filename?.trim() || undefined,
        line: Number.isFinite(event.lineno) ? event.lineno : undefined,
      },
    });
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    writeTuttiExternalLog({
      event: 'renderer.unhandled_rejection',
      level: 'error',
      details: errorDetails(event.reason),
    });
  });
}
