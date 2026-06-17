import { Button } from '@tutti-os/ui-system';
import { ChevronLeft, FilePlus2, Pencil, Rocket, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { isAutomationActive } from '../lib/schedule';
import { PromptPreviewText } from './PromptPreviewText';
import type { Automation } from '../types';

type AppHeaderProps = {
  inboxAutomation: Automation | null;
  showCreate: boolean;
  onCreate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRun: () => void;
  onBack: () => void;
};

export function AppHeader({
  inboxAutomation,
  showCreate,
  onCreate,
  onEdit,
  onDelete,
  onRun,
  onBack,
}: AppHeaderProps) {
  const { t } = useI18n();

  if (inboxAutomation) {
    const active = isAutomationActive(inboxAutomation);

    return (
      <header className="app-header">
        <div id="appTitleBlock">
          <div className="app-title-row">
            <h1 id="appTitle">
              <button className="title-back-button" type="button" onClick={onBack}>
                <ChevronLeft size={22} aria-hidden="true" />
                <span>{inboxAutomation.name}</span>
              </button>
            </h1>
          </div>
          <PromptPreviewText as="p" className="detail-prompt" value={inboxAutomation.prompt} />
        </div>
        <div className="detail-actions">
          <Button
            variant="ghost"
            size="dialog"
            className="text-[var(--state-danger)] hover:bg-[var(--on-danger)] hover:text-[var(--state-danger)]"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
            {t('common.delete')}
          </Button>
          <Button
            id="runButton"
            variant="ghost"
            size="dialog"
            type="button"
            disabled={active}
            aria-busy={active}
            onClick={onRun}
          >
            <Rocket size={16} aria-hidden="true" />
            {t('common.runNow')}
          </Button>
        </div>
        <Button id="headerEditButton" className="primary-action" type="button" onClick={onEdit}>
          <Pencil size={16} aria-hidden="true" />
          {t('common.edit')}
        </Button>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div id="appTitleBlock">
        <div className="app-title-row">
          <h1 id="appTitle">{t('app.title')}</h1>
        </div>
      </div>
      {showCreate ? (
        <Button id="createButton" className="primary-action" type="button" onClick={onCreate}>
          <FilePlus2 size={16} aria-hidden="true" />
          {t('common.create')}
        </Button>
      ) : null}
    </header>
  );
}
