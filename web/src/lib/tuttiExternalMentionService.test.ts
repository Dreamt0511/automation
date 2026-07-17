import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTuttiExternalMentionService } from './tuttiExternalMentionService';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tutti external mention service', () => {
  it('resolves an external mention through the query-only host fallback', async () => {
    const query = vi.fn(async (input: { keyword: string }) => input.keyword === 'Automation' ? [
      {
        providerId: 'workspace-app' as const,
        itemId: 'automation',
        label: 'Automation',
        thumbnailUrl: '/assets/automation.png',
        insert: {
          kind: 'mention' as const,
          mention: {
            entityId: 'automation',
            label: 'Automation',
            scope: { workspaceId: 'workspace-1' },
            presentation: { iconUrl: '/assets/automation.png' },
          },
        },
      },
    ] : []);
    vi.stubGlobal('window', { tuttiExternal: { at: { query } } });

    const service = createTuttiExternalMentionService();
    const snapshot = await service.resolve({
      providerId: 'workspace-app',
      entityId: 'automation',
      label: 'Automation',
      scope: { workspaceId: 'workspace-1' },
    });

    expect(snapshot).toBeTruthy();
    expect(query).toHaveBeenCalledWith({
      keyword: 'Automation',
      maxResults: 50,
      providers: ['workspace-app'],
    });
    service.dispose();
  });

  it('unsubscribes exactly once when the root service is disposed', () => {
    const unsubscribe = vi.fn();
    vi.stubGlobal('window', {
      tuttiExternal: {
        at: {
          query: vi.fn(async () => []),
          subscribe: vi.fn(() => unsubscribe),
        },
      },
    });

    const service = createTuttiExternalMentionService();
    service.dispose();
    service.dispose();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('keeps the editor usable when the host bridge is unavailable', () => {
    vi.stubGlobal('window', {});

    const service = createTuttiExternalMentionService();
    expect(service.listProviders().map((provider) => provider.id)).toEqual(['workspace-app', 'agent-target']);
    service.dispose();
  });
});
