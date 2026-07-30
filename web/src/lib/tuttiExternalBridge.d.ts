import type { TuttiExternalAtRichTextBridge } from '@tutti-os/workspace-external-core/rich-text';
import type { TuttiExternalBridge } from '@tutti-os/workspace-external-core/contracts';

type AutomationTuttiExternalBridge = TuttiExternalAtRichTextBridge & {
  app?: {
    getContext(): Promise<{ locale?: string } & Record<string, unknown>>;
    subscribe(listener: (context: { locale?: string } & Record<string, unknown>) => void): () => void;
  };
  logs?: {
    write(input: {
      details?: Record<string, unknown>;
      event: string;
      level?: 'debug' | 'info' | 'warn' | 'error';
    }): void;
  };
  userProjects?: Pick<TuttiExternalBridge['userProjects'], 'list'>;
};

declare global {
  interface Window {
    tuttiExternal?: AutomationTuttiExternalBridge;
  }
}

export {};
