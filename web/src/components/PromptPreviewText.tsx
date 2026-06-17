import { extractPlainTextFromContent } from '@tutti-os/ui-rich-text';
import type { ElementType } from 'react';

type PromptPreviewTextProps = {
  value: string;
  as?: ElementType;
  className?: string;
};

export function PromptPreviewText({
  value,
  as: Component = 'span',
  className,
}: PromptPreviewTextProps) {
  return <Component className={className}>{extractPlainTextFromContent(value)}</Component>;
}
