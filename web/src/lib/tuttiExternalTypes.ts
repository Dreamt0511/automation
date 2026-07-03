import type { TuttiExternalAtProviderId } from '@tutti-os/workspace-external-core/contracts';
import type { RichTextTriggerProvider } from '@tutti-os/ui-rich-text/types';

export type AgentContextMentionProviderId = TuttiExternalAtProviderId;

export type AutomationTuttiExternalMentionPresentation = {
  agentProviderId?: string;
  agentIconUrl?: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  subtitle?: string;
  description?: string;
  participant?: string;
  status?: string;
  statusDataStatus?: string;
  statusLabel?: string;
  statusPulse?: string;
  userAvatarPlaceholderUrl?: string;
};

export type AutomationTuttiExternalAtInsertResult =
  | {
      kind: 'mention';
      mention: {
        entityId: string;
        label: string;
        scope?: Readonly<Record<string, string>>;
        presentation?: AutomationTuttiExternalMentionPresentation;
      };
    }
  | {
      kind: 'markdown-link';
      label: string;
      href: string;
    }
  | {
      kind: 'text';
      text: string;
    };

export type AutomationTuttiExternalAtQueryResult = {
  providerId: TuttiExternalAtProviderId;
  itemId: string;
  label: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
  insert: AutomationTuttiExternalAtInsertResult;
};

export type AgentContextMentionProvider<TItem = unknown> = Omit<
  RichTextTriggerProvider<TItem>,
  'toInsertResult'
> & {
  trigger: '@';
  toInsertResult: (item: TItem) => AutomationTuttiExternalAtInsertResult;
  getItemIconUrl?: (
    item: TItem,
  ) => string | null | undefined | Promise<string | null | undefined>;
};
