import { createTuttiExternalRichTextMentionService } from '@tutti-os/workspace-external-core/rich-text';

export function createTuttiExternalMentionService() {
  return createTuttiExternalRichTextMentionService({
    getBridge: () => (typeof window === 'undefined' ? undefined : window.tuttiExternal),
    providerIds: ['workspace-app', 'agent-target'],
  });
}
