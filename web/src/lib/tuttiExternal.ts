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
};

declare global {
  interface Window {
    tuttiExternal?: TuttiExternalBridge;
  }
}

const atProviderIds = [
  'file',
  'workspace-issue',
  'workspace-app',
  'agent-session',
  'agent-generated-file',
] as const satisfies readonly AgentContextMentionProviderId[];

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
  providerId: AgentContextMentionProviderId,
  identity: RichTextMentionIdentity,
): Promise<{ label: string; presentation?: AutomationTuttiExternalMentionPresentation } | null> {
  const bridge = window.tuttiExternal?.at;
  if (!bridge) {
    return null;
  }

  try {
    const entityId = identity.entityId.trim();
    if (!entityId) {
      return null;
    }
    const items = await bridge.query({
      keyword: entityId,
      maxResults: 100,
      providers: [providerId],
    });
    const item = items.find(
      (candidate) => candidate.providerId === providerId && candidate.itemId === entityId,
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
  return atProviderIds.map((providerId) => ({
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
          maxResults: input.maxResults,
          providers: [providerId],
        });
        const filtered = items.filter((item) => item.providerId === providerId);
        return filtered;
      } catch (error) {
        return [];
      }
    },
    getItemKey: (item) => `${item.providerId}:${item.itemId}`,
    getItemLabel: (item) => item.label,
    getItemSubtitle: (item) => item.subtitle,
    getItemThumbnailUrl: (item) => item.thumbnailUrl,
    toInsertResult: (item) => normalizeAtInsertResult(item),
    resolveMention: (identity) => resolveAtMention(providerId, identity),
  }));
}
