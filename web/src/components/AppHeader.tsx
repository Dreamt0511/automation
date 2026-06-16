import { ArrowLeft, FilePlus2, Pencil, Play, Rocket, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n';
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
    return (
      <header className="app-header">
        <div id="appTitleBlock">
          <div className="app-title-row">
            <button
              className="ui-button ui-button-ghost ui-button-icon-sm detail-info-button"
              type="button"
              aria-label={t('common.close')}
              onClick={onBack}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <h1 id="appTitle">{inboxAutomation.name}</h1>
          </div>
          <p className="detail-prompt">{inboxAutomation.prompt}</p>
        </div>
        <div className="detail-actions">
          <button
            className="ui-button ui-button-ghost ui-button-dialog ui-button-danger-ghost"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
            {t('common.delete')}
          </button>
          <button className="ui-button ui-button-ghost ui-button-dialog" type="button" onClick={onRun}>
            <Rocket size={16} aria-hidden="true" />
            {t('common.runNow')}
          </button>
        </div>
        <button className="primary-action" type="button" onClick={onEdit}>
          <Pencil size={16} aria-hidden="true" />
          {t('common.edit')}
        </button>
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
        <button className="primary-action" type="button" onClick={onCreate}>
          <FilePlus2 size={16} aria-hidden="true" />
          {t('common.create')}
        </button>
      ) : null}
    </header>
  );
}
