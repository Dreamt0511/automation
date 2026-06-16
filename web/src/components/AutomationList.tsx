import { Ellipsis, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n';
import { automationScheduleLabel, isAutomationActive } from '../lib/schedule';
import type { Automation } from '../types';

type AutomationListProps = {
  automations: Automation[];
  isLoading: boolean;
  onCreate: () => void;
  onOpenInbox: (id: string) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (automation: Automation) => void;
  onRun: (automation: Automation) => void;
  onToggleEnabled: (automation: Automation, enabled: boolean) => void;
};

export function AutomationList({
  automations,
  isLoading,
  onCreate,
  onOpenInbox,
  onEdit,
  onDelete,
  onRun,
  onToggleEnabled,
}: AutomationListProps) {
  const { t } = useI18n();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="automation-surface" aria-label={t('aria.automations')}>
        <div className="automation-list">
          <div className="list-loading" role="status" aria-label={t('loading.automations')}>
            <span className="loading-spinner" aria-hidden="true" />
          </div>
        </div>
      </section>
    );
  }

  if (automations.length === 0) {
    return (
      <section className="automation-surface" aria-label={t('aria.automations')}>
        <div className="automation-list">
          <div className="empty-state">
            <h2>{t('empty.automations')}</h2>
            <button className="primary-action" type="button" onClick={onCreate}>
              {t('common.createAutomation')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="automation-surface" aria-label={t('aria.automations')}>
      <div className="automation-list">
        {automations.map((item) => {
          const active = isAutomationActive(item);
          return (
            <article key={item.id} className={`automation-card ${item.enabled ? '' : 'paused'}`}>
              <button className="automation-main" type="button" onClick={() => onOpenInbox(item.id)}>
                <span>
                  <strong>{item.name}</strong>
                  <small className="automation-description-row">
                    <span className="automation-schedule-summary">
                      {automationScheduleLabel(item, t)}
                    </span>
                    <span className="automation-description-divider" aria-hidden="true" />
                    <span className="automation-description-text">{item.prompt}</span>
                  </small>
                </span>
              </button>
              <div className="automation-actions">
                {!item.enabled ? (
                  <span className="automation-status-badge">{t('status.paused')}</span>
                ) : null}
                {item.unreviewedRunCount ? (
                  <span
                    className="automation-status-dot"
                    data-slot="status-dot"
                    data-tone="amber"
                    data-size="sm"
                    aria-label={t('aria.hasUpdates')}
                    role="img"
                  />
                ) : null}
                <div className="action-buttons">
                  <button
                    className={`ui-button ui-button-ghost ui-button-icon-sm icon-action ${active ? 'loading' : ''}`}
                    type="button"
                    aria-label={t('common.run')}
                    disabled={active}
                    onClick={() => onRun(item)}
                  >
                    <Play size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="ui-button ui-button-ghost ui-button-icon-sm icon-action"
                    type="button"
                    aria-label={t('common.edit')}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <span className="more-menu" data-slot="dropdown-menu">
                    <button
                      className="ui-button ui-button-ghost ui-button-icon-sm icon-action"
                      type="button"
                      aria-label={t('common.more')}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === item.id}
                      onClick={() => setOpenMenuId((current) => (current === item.id ? null : item.id))}
                    >
                      <Ellipsis size={16} aria-hidden="true" />
                    </button>
                    {openMenuId === item.id ? (
                      <div className="t-dropdown dropdown-menu-content more-dropdown" role="menu">
                        <button
                          className="dropdown-menu-item"
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onToggleEnabled(item, !item.enabled);
                            setOpenMenuId(null);
                          }}
                        >
                          {item.enabled ? <Pause size={16} /> : <Play size={16} />}
                          {item.enabled ? t('common.pause') : t('common.resume')}
                        </button>
                        <button
                          className="dropdown-menu-item"
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onDelete(item);
                            setOpenMenuId(null);
                          }}
                        >
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </button>
                      </div>
                    ) : null}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
