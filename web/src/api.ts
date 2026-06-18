import { writeTuttiExternalLog } from './lib/tuttiExternalLogs';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    writeTuttiExternalLog({
      event: 'api.request_failed',
      level: 'warn',
      details: {
        method,
        path,
        status: response.status,
        error: body.error ?? 'Request failed',
      },
    });
    throw new Error(body.error ?? 'Request failed');
  }
  return body;
}
