import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Spinner,
  StatusDot,
} from '@tutti-os/ui-system';
import { Ellipsis, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { automationScheduleLabel, isAutomationActive } from '../lib/schedule';
import { runActionLabel } from '../lib/runs';
import { featuredEmptyTemplates, type TemplateDefinition } from '../lib/templates';
import { PromptPreviewText } from './PromptPreviewText';
import { TemplateIcon } from './TemplateIcon';
import type { Automation } from '../types';

type AutomationListProps = {
  automations: Automation[];
  isLoading: boolean;
  onCreate: (template?: TemplateDefinition) => void;
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
  const { t, locale } = useI18n();

  if (isLoading) {
    return (
      <section className="automation-surface" aria-label={t('aria.automations')}>
        <div className="automation-list">
          <div className="list-loading" role="status" aria-label={t('loading.automations')}>
            <Spinner size={22} />
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
            <div className="empty-icon" aria-hidden="true">
              <img src="/assets/automation-empty.png" alt="" decoding="async" />
            </div>
            <h2>{t('empty.automations')}</h2>
            <Button className="primary-action" type="button" onClick={() => onCreate()}>
              <Plus size={16} aria-hidden="true" />
              {t('common.createAutomation')}
            </Button>
            <div className="empty-template-list" aria-label={t('aria.starterTemplates')}>
              {featuredEmptyTemplates().map((template) => (
                <button
                  key={template.id}
                  className={`empty-template-card template-tone-${template.id}`}
                  type="button"
                  onClick={() => onCreate(template)}
                >
                  <span className="template-icon" aria-hidden="true">
                    <TemplateIcon name={template.icon} />
                  </span>
                  <span>{t(template.nameKey)}</span>
                </button>
              ))}
            </div>
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
                      {automationScheduleLabel(item, t, locale)}
                    </span>
                    <span className="automation-description-divider" aria-hidden="true" />
                    <PromptPreviewText className="automation-description-text" value={item.prompt} />
                  </small>
                </span>
              </button>
              <div className="automation-actions">
                {!item.enabled ? (
                  <Badge
                    variant="destructive"
                    className="automation-status-badge"
                    data-status="paused"
                  >
                    {t('status.paused')}
                  </Badge>
                ) : null}
                {item.unreviewedRunCount ? (
                  <StatusDot tone="amber" size="sm" ariaLabel={t('aria.hasUpdates')} />
                ) : null}
                <div className="action-buttons">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={`icon-action${active ? ' loading' : ''}`}
                    type="button"
                    aria-label={active ? runActionLabel(item.activeRunStatus, t) : t('common.run')}
                    aria-busy={active}
                    disabled={active}
                    onClick={() => onRun(item)}
                  >
                    {active ? <Spinner size={16} /> : <Play size={16} aria-hidden="true" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="icon-action"
                    type="button"
                    aria-label={t('common.edit')}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="icon-action"
                        type="button"
                        aria-label={t('common.more')}
                      >
                        <Ellipsis size={16} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-32 w-max">
                      <DropdownMenuItem
                        onSelect={() => onToggleEnabled(item, !item.enabled)}
                      >
                        {item.enabled ? <Pause size={16} /> : <Play size={16} />}
                        {item.enabled ? t('common.pause') : t('common.resume')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDelete(item)}>
                        <Trash2 size={16} />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
