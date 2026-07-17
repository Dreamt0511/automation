import { RichTextMentionServiceProvider } from '@tutti-os/ui-rich-text/editor';
import { createRichTextMentionService } from '@tutti-os/ui-rich-text/service';
import { useEffect, useState, type ReactNode } from 'react';
import { createTuttiExternalMentionService } from '../lib/tuttiExternalMentionService';

export function TuttiExternalMentionServiceRoot({ children }: { children: ReactNode }) {
  const [fallbackService] = useState(() => createRichTextMentionService({ providers: [] }));
  const [service, setService] = useState<ReturnType<typeof createTuttiExternalMentionService>>(fallbackService);

  useEffect(() => {
    const next = createTuttiExternalMentionService();
    setService(next);
    fallbackService.dispose();
    return () => next.dispose();
  }, [fallbackService]);

  return <RichTextMentionServiceProvider service={service}>{children}</RichTextMentionServiceProvider>;
}
