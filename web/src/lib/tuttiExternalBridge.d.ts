import type { TuttiExternalAtRichTextBridge } from '@tutti-os/workspace-external-core/rich-text';

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
};

declare global {
  interface Window {
    tuttiExternal?: AutomationTuttiExternalBridge;
  }
}

export {};
