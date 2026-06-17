import { useMemo } from 'react';
import { RichTextTriggerEditor } from '@tutti-os/ui-rich-text/editor';
import type { RichTextTriggerProvider } from '@tutti-os/ui-rich-text/types';
import { createTuttiExternalAgentContextMentionProviders } from '../lib/tuttiExternal';
import { useI18n } from '../i18n';

type PromptRichTextInputProps = {
  value: string;
  placeholder: string;
  workspaceId?: string | null;
  sessionCwd?: string | null;
  onChange: (value: string) => void;
};

export function PromptRichTextInput({
  value,
  placeholder,
  workspaceId,
  sessionCwd,
  onChange,
}: PromptRichTextInputProps) {
  const { t } = useI18n();
  const triggerProviders = useMemo<readonly RichTextTriggerProvider<any>[]>(
    () => createTuttiExternalAgentContextMentionProviders(),
    [],
  );

  return (
    <RichTextTriggerEditor
      className="prompt-rich-text-field"
      maxResults={30}
      menuZIndex="var(--z-dialog-popover)"
      minQueryLength={0}
      placeholder={placeholder}
      placeholderClassName="prompt-rich-text-placeholder"
      textareaClassName="prompt-input prompt-rich-text-editor"
      textOverrides={{
        loadingLabel: t('form.promptMentionLoading'),
        noMatchesLabel: t('form.promptMentionEmpty'),
        removeReferenceActionLabel: t('form.promptMentionRemove'),
      }}
      triggerProviders={triggerProviders}
      value={value}
      onChange={onChange}
      overlay={
        <span
          data-prompt-context
          data-workspace-id={workspaceId ?? ''}
          data-session-cwd={sessionCwd ?? ''}
          hidden
        />
      }
    />
  );
}
