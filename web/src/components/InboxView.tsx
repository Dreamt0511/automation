import DOMPurify from 'dompurify';
import { ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '../i18n';
import { automationScheduleLabel, formatDate } from '../lib/schedule';
import type { Automation, AutomationRun, InboxFilter } from '../types';

const filters: InboxFilter[] = ['all', 'success', 'fail', 'skip'];

type InboxViewProps = {
  automation: Automation | null;
  runs: AutomationRun[];
  filter: InboxFilter;
  isLoading: boolean;
  onFilterChange: (filter: InboxFilter) => void;
  onRefresh: () => void;
};

export function InboxView({
  automation,
  runs,
  filter,
  isLoading,
  onFilterChange,
  onRefresh,
}: InboxViewProps) {
  const { t } = useI18n();

  if (!automation) return null;

  const emptyKey =
    filter === 'all'
      ? 'empty.runs'
      : filter === 'success'
        ? 'empty.success'
        : filter === 'fail'
          ? 'empty.wrongs'
          : 'empty.skipped';

  return (
    <section className="inbox-surface" aria-label={t('aria.automationInbox')}>
      <div className="inbox-tabs" role="tablist" aria-label={t('aria.resultStatus')}>
        {filters.map((item) => (
          <button
            key={item}
            className="inbox-tab"
            type="button"
            role="tab"
            data-active={filter === item ? 'true' : 'false'}
            aria-selected={filter === item}
            onClick={() => onFilterChange(item)}
          >
            {t(`filter.${item === 'fail' ? 'failed' : item}`)}
          </button>
        ))}
      </div>

      <div className="tsh-custom-scroll-area run-inbox-scroll-area">
        <div className="run-inbox">
          {isLoading ? (
            <div className="list-loading" role="status" aria-label={t('loading.runs')}>
              <span className="loading-spinner" aria-hidden="true" />
            </div>
          ) : runs.length === 0 ? (
            <div className="empty-state compact">
              <p>{t(emptyKey)}</p>
            </div>
          ) : (
            runs.map((run) => <RunCard key={run.id} run={run} onRefresh={onRefresh} />)
          )}
        </div>
      </div>

      <aside className="status-section detail-status-sidebar" aria-label={t('aria.automationStatus')}>
        <span className="status-label">{t('status.status')}</span>
        <div className="status-pill">
          <span
            className="status-dot"
            data-slot="status-dot"
            data-size="sm"
            data-tone={automation.enabled ? 'green' : 'amber'}
            aria-hidden="true"
          />
          <span>{automation.enabled ? t('status.active') : t('status.paused')}</span>
        </div>
        <div className="status-metrics">
          <div>
            <span>{t('status.schedule')}</span>
            <strong>{automationScheduleLabel(automation, t)}</strong>
          </div>
          <div>
            <span>{t('status.nextRun')}</span>
            <strong>{automation.nextRunAt ? formatDate(automation.nextRunAt) : t('status.notScheduled')}</strong>
          </div>
          <div>
            <span>{t('status.lastRan')}</span>
            <strong>{automation.lastRunAt ? formatDate(automation.lastRunAt) : t('status.never')}</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}

function RunCard({ run, onRefresh }: { run: AutomationRun; onRefresh: () => void }) {
  const { t } = useI18n();
  const statusKey = run.taskStatus ?? run.runStatus;
  const statusLabel = t(`run.status.${statusKey}` as 'run.status.success');

  const openAgentSession = async () => {
    await fetch(`/api/runs/${encodeURIComponent(run.id)}/open-agent`, { method: 'POST' });
    onRefresh();
  };

  const summary = run.summary?.trim() || t('result.empty');
  const sanitized = DOMPurify.sanitize(summary);

  return (
    <article className="run-card">
      <header className="run-card-header">
        <div>
          <strong>{statusLabel}</strong>
          <small>{formatDate(run.finishedAt ?? run.queuedAt)}</small>
        </div>
        {run.agentSessionId ? (
          <button
            className="ui-button ui-button-ghost ui-button-icon-sm icon-action"
            type="button"
            aria-label={t('aria.openAgentSession')}
            onClick={() => void openAgentSession()}
          >
            <ExternalLink size={16} aria-hidden="true" />
          </button>
        ) : null}
      </header>
      <div className="run-card-body markdown-body">
        <ReactMarkdown>{sanitized}</ReactMarkdown>
      </div>
      {run.error ? <p className="run-card-error">{run.error}</p> : null}
    </article>
  );
}
