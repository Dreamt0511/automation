import type { TuttiExternalAtProviderId } from '@tutti-os/workspace-external-core/contracts';
import type { AutomationTuttiExternalAtQueryResult } from '../lib/tuttiExternalTypes';
import type { TuttiExternalLogInput } from '../lib/tuttiExternalLogs';

const devWorkspaceId = 'dev-workspace';

const fixtureItems: readonly AutomationTuttiExternalAtQueryResult[] = [
  // {
  //   providerId: 'file',
  //   itemId: 'README.md',
  //   label: 'README.md',
  //   subtitle: 'Repository root',
  //   insert: {
  //     kind: 'markdown-link',
  //     label: 'README.md',
  //     href: 'README.md',
  //   },
  // },
  // {
  //   providerId: 'file',
  //   itemId: 'web/src/App.tsx',
  //   label: 'App.tsx',
  //   subtitle: 'web/src/App.tsx',
  //   insert: {
  //     kind: 'markdown-link',
  //     label: 'App.tsx',
  //     href: 'web/src/App.tsx',
  //   },
  // },
  // {
  //   providerId: 'workspace-issue',
  //   itemId: 'issue-42',
  //   label: 'Daily automation review',
  //   subtitle: 'In progress',
  //   insert: {
  //     kind: 'mention',
  //     mention: {
  //       entityId: 'issue-42',
  //       label: 'Daily automation review',
  //       scope: {
  //         workspaceId: devWorkspaceId,
  //         topicId: 'dev-topic',
  //       },
  //       presentation: {
  //         status: 'In progress',
  //         description: 'Review daily automation outcomes and follow-ups.',
  //       },
  //     },
  //   },
  // },
  {
    providerId: 'workspace-app',
    itemId: 'automation',
    label: 'Automation',
    subtitle: 'Workspace app',
    thumbnailUrl: '/assets/automation-empty.png',
    insert: {
      kind: 'mention',
      mention: {
        entityId: 'automation',
        label: 'Automation',
        scope: {
          workspaceId: devWorkspaceId,
        },
        presentation: {
          iconUrl: '/assets/automation-empty.png',
          subtitle: 'Workspace app',
        },
      },
    },
  },
  {
    providerId: 'agent-target',
    itemId: 'codex',
    label: 'Codex',
    subtitle: 'Agent target',
    insert: {
      kind: 'mention',
      mention: {
        entityId: 'codex',
        label: 'Codex',
        scope: {
          workspaceId: devWorkspaceId,
          providerId: 'codex',
        },
        presentation: {
          agentProviderId: 'codex',
          subtitle: 'Agent target',
          description: 'Start a Codex agent session',
        },
      },
    },
  },
  {
    providerId: 'agent-target',
    itemId: 'claude-code',
    label: 'Claude Code',
    subtitle: 'Agent target',
    insert: {
      kind: 'mention',
      mention: {
        entityId: 'claude-code',
        label: 'Claude Code',
        scope: {
          workspaceId: devWorkspaceId,
          providerId: 'claude-code',
        },
        presentation: {
          agentProviderId: 'claude-code',
          subtitle: 'Agent target',
          description: 'Start a Claude Code agent session',
        },
      },
    },
  },
  // {
  //   providerId: 'agent-session',
  //   itemId: 'session-7',
  //   label: 'Refactor prompt editor',
  //   subtitle: 'Agent session',
  //   insert: {
  //     kind: 'mention',
  //     mention: {
  //       entityId: 'session-7',
  //       label: 'Refactor prompt editor',
  //       scope: {
  //         workspaceId: devWorkspaceId,
  //       },
  //       presentation: {
  //         status: 'running',
  //         subtitle: 'Agent session',
  //         description: 'Refactor prompt editor',
  //       },
  //     },
  //   },
  // },
  // {
  //   providerId: 'agent-generated-file',
  //   itemId: 'report.md',
  //   label: 'report.md',
  //   subtitle: 'Generated output',
  //   insert: {
  //     kind: 'markdown-link',
  //     label: 'report.md',
  //     href: 'report.md',
  //   },
  // },
];

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

function matchesKeyword(item: AutomationTuttiExternalAtQueryResult, keyword: string): boolean {
  if (!keyword) return true;
  const haystack = [item.label, item.subtitle ?? '', item.itemId].join(' ').toLowerCase();
  return haystack.includes(keyword);
}

function createMockBridge() {
  return {
    app: {
      async getContext() {
        return {
          appId: 'automation',
          locale: document.documentElement.lang || 'en',
          workspaceId: devWorkspaceId,
        };
      },
      subscribe(listener: (context: { locale?: string } & Record<string, unknown>) => void) {
        void this.getContext().then(listener);
        return () => undefined;
      },
    },
    at: {
      async query(input: {
        keyword: string;
        maxResults?: number;
        providers?: readonly TuttiExternalAtProviderId[];
      }) {
        const keyword = normalizeKeyword(input.keyword);
        const allowedProviders = input.providers?.length ? new Set(input.providers) : null;
        const maxResults = Math.max(0, input.maxResults ?? 20);
        const filtered = fixtureItems.filter((item) => {
          if (allowedProviders && !allowedProviders.has(item.providerId)) {
            return false;
          }
          return matchesKeyword(item, keyword);
        });
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        return filtered.slice(0, maxResults);
      },
    },
    logs: {
      write(input: TuttiExternalLogInput) {
        if (import.meta.env.DEV) {
          console.info('[tuttiExternal.logs.write]', input);
        }
      },
    },
  };
}

if (typeof window !== 'undefined' && !window.tuttiExternal) {
  window.tuttiExternal = createMockBridge();
}

export {};
