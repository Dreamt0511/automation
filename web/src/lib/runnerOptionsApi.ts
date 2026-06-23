import { api } from '../api';
import type { RunnerOptions } from '../types';

export async function fetchRunnerOptions(provider: string, locale: string): Promise<RunnerOptions> {
  const params = new URLSearchParams({ locale });
  const normalizedProvider = String(provider ?? '').trim();
  if (normalizedProvider) {
    params.set('provider', normalizedProvider);
  }
  return api<RunnerOptions>(`/api/runner-options?${params.toString()}`);
}

export function runnerOptionsProviderId(runnerOptions: RunnerOptions): string {
  return String(runnerOptions.provider ?? '').trim();
}

export function runnerOptionsMatchProvider(runnerOptions: RunnerOptions, provider: string): boolean {
  const normalizedProvider = String(provider ?? '').trim();
  if (!normalizedProvider) return true;
  return runnerOptionsProviderId(runnerOptions) === normalizedProvider;
}
