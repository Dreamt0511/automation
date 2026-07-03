import { useMemo } from 'react';
import {
  RichTextTriggerEditor,
  type RichTextTriggerEditorProps,
} from '@tutti-os/ui-rich-text/editor';
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
  const palette = useMemo<NonNullable<RichTextTriggerEditorProps['palette']>>(
    () => ({
      categories: [
        {
          id: 'apps',
          label: t('form.promptMentionAppsTab'),
          providerIds: ['workspace-app'],
        },
        {
          id: 'agents',
          label: t('form.promptMentionAgentsTab'),
          providerIds: ['agent-target'],
        },
      ],
      defaultCategoryId: 'agents',
      labels: {
        tabHint: t('form.promptMentionTabHint'),
        cycleFilter: t('form.promptMentionCycleFilter'),
        moveSelection: t('form.promptMentionMoveSelection'),
        empty: t('form.promptMentionEmpty'),
        listbox: t('form.promptMentionListbox'),
      },
      maxHeightPx: 360,
    }),
    [t],
  );

  return (
    <RichTextTriggerEditor
      className="prompt-rich-text-field"
      menuZIndex="var(--z-dialog-popover)"
      minQueryLength={0}
      palette={palette}
      placeholder={value.trim() ? '' : placeholder}
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
