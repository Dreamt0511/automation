import type { RichTextMentionIdentity } from '@tutti-os/ui-rich-text/types';
import type {
  AgentContextMentionProvider,
  AgentContextMentionProviderId,
  AutomationTuttiExternalAtInsertResult,
  AutomationTuttiExternalAtQueryResult,
  AutomationTuttiExternalMentionPresentation,
} from './tuttiExternalTypes';

type TuttiExternalBridge = {
  app?: {
    getContext(): Promise<{ locale?: string } & Record<string, unknown>>;
    subscribe(listener: (context: { locale?: string } & Record<string, unknown>) => void): () => void;
  };
  at?: {
    query(input: {
      keyword: string;
      maxResults?: number;
      providers?: readonly AgentContextMentionProviderId[];
    }): Promise<readonly AutomationTuttiExternalAtQueryResult[]>;
  };
  logs?: {
    write(input: {
      details?: Record<string, unknown>;
      event: string;
      level?: 'debug' | 'info' | 'warn' | 'error';
    }): void;
  };
};

declare global {
  interface Window {
    tuttiExternal?: TuttiExternalBridge;
  }
}

export const agentContextMentionProviderIds = [
  'workspace-app',
  'agent-target',
] as const satisfies readonly AgentContextMentionProviderId[];

const mentionResolveProviderIds = agentContextMentionProviderIds;
const agentContextMentionProviderIdSet: ReadonlySet<AgentContextMentionProviderId> = new Set(
  agentContextMentionProviderIds,
);
const defaultMentionMaxResults = 30;

function isAgentContextMentionProviderId(
  value: string,
): value is (typeof agentContextMentionProviderIds)[number] {
  return agentContextMentionProviderIdSet.has(value as AgentContextMentionProviderId);
}

function normalizeMentionPresentation(
  item: AutomationTuttiExternalAtQueryResult,
  presentation?: AutomationTuttiExternalMentionPresentation,
): AutomationTuttiExternalMentionPresentation | undefined {
  const iconUrl =
    presentation?.iconUrl?.trim() ||
    presentation?.thumbnailUrl?.trim() ||
    item.thumbnailUrl?.trim() ||
    undefined;
  const nextPresentation: AutomationTuttiExternalMentionPresentation = {
    ...presentation,
  };

  if (iconUrl) {
    nextPresentation.iconUrl = iconUrl;
  }

  return Object.keys(nextPresentation).length > 0 ? nextPresentation : undefined;
}

function normalizeAtInsertResult(
  item: AutomationTuttiExternalAtQueryResult,
): AutomationTuttiExternalAtInsertResult {
  const { insert } = item;
  if (insert.kind !== 'mention') {
    return insert;
  }

  return {
    kind: 'mention',
    mention: {
      entityId: insert.mention.entityId,
      label: insert.mention.label,
      scope: insert.mention.scope,
      presentation: normalizeMentionPresentation(item, insert.mention.presentation),
    },
  };
}

async function resolveAtMention(
  providerIds: readonly AgentContextMentionProviderId[],
  identity: RichTextMentionIdentity,
): Promise<{ label: string; presentation?: AutomationTuttiExternalMentionPresentation } | null> {
  const bridge = window.tuttiExternal?.at;
  if (!bridge) {
    return null;
  }

  try {
    const queryProviderIds =
      isAgentContextMentionProviderId(identity.providerId) &&
      providerIds.includes(identity.providerId)
        ? [identity.providerId]
        : providerIds;
    const items = await bridge.query({
      keyword: '',
      maxResults: 100,
      providers: queryProviderIds,
    });
    const item = items.find(
      (candidate) =>
        providerIds.includes(candidate.providerId) &&
        candidate.providerId === identity.providerId &&
        candidate.itemId === identity.entityId,
    );
    if (!item || item.insert.kind !== 'mention') {
      return null;
    }

    const insert = normalizeAtInsertResult(item);
    if (insert.kind !== 'mention') {
      return null;
    }

    return {
      label: insert.mention.label,
      presentation: insert.mention.presentation,
    };
  } catch (error) {
    return null;
  }
}

export function createTuttiExternalAgentContextMentionProviders(): readonly AgentContextMentionProvider<AutomationTuttiExternalAtQueryResult>[] {
  return agentContextMentionProviderIds.map((providerId) => ({
    id: providerId,
    trigger: '@',
    async query(input) {
      const bridge = window.tuttiExternal?.at;
      if (!bridge) {
        return [];
      }
      try {
        const items = await bridge.query({
          keyword: input.keyword,
          maxResults: input.maxResults ?? defaultMentionMaxResults,
          providers: [providerId],
        });
        return items.filter((item) => item.providerId === providerId);
      } catch (error) {
        return [];
      }
    },
    getItemKey: (item) => `${item.providerId}:${item.itemId}`,
    getItemLabel: (item) => item.label,
    getItemSubtitle: (item) => item.subtitle,
    getItemIconUrl: (item) =>
      item.insert.kind === 'mention'
        ? item.insert.mention.presentation?.iconUrl ?? item.thumbnailUrl
        : item.thumbnailUrl,
    toInsertResult: (item) => normalizeAtInsertResult(item),
    resolveMention: (identity) => resolveAtMention(mentionResolveProviderIds, identity),
  }));
}
