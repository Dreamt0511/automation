import { StatusDot } from '@tutti-os/ui-system';
import { useEffect, useMemo, useState, type MouseEvent, type RefObject } from 'react';
import { useI18n } from '../i18n';
import { runnerDetailsFromSettings } from '../lib/runnerDetails';
import { fetchRunnerOptions, runnerOptionsMatchProvider } from '../lib/runnerOptionsApi';
import { automationScheduleLabel, formatDate } from '../lib/schedule';
import type { Automation, RunnerOptions } from '../types';

type AutomationStatusSectionProps = {
  automation: Automation;
  runnerOptions: RunnerOptions;
  statusSectionRef?: RefObject<HTMLElement | null>;
  onSectionClick?: (event: MouseEvent<HTMLElement>) => void;
};

export function AutomationStatusSection({
  automation,
  runnerOptions,
  statusSectionRef,
  onSectionClick,
}: AutomationStatusSectionProps) {
  const { t, locale } = useI18n();
  const preferredProvider = String(automation.runnerSettings?.provider ?? '').trim();
  const [statusRunnerOptions, setStatusRunnerOptions] = useState(runnerOptions);

  useEffect(() => {
    if (!preferredProvider || runnerOptionsMatchProvider(runnerOptions, preferredProvider)) {
      setStatusRunnerOptions(runnerOptions);
      return;
    }

    let cancelled = false;
    void fetchRunnerOptions(preferredProvider, locale)
      .then((options) => {
        if (!cancelled) setStatusRunnerOptions(options);
      })
      .catch(() => {
        if (!cancelled) setStatusRunnerOptions(runnerOptions);
      });

    return () => {
      cancelled = true;
    };
  }, [automation.id, locale, preferredProvider, runnerOptions]);

  const runnerDetails = useMemo(
    () => runnerDetailsFromSettings(automation, statusRunnerOptions, t),
    [automation, statusRunnerOptions, t],
  );

  return (
    <aside
      id="statusSection"
      ref={statusSectionRef}
      className="status-section detail-status-sidebar"
      aria-label={t('aria.automationStatus')}
      data-state={undefined}
      onClick={onSectionClick}
    >
      <span className="status-label">{t('status.status')}</span>
      <div className="status-pill">
        <StatusDot tone={automation.enabled ? 'green' : 'red'} size="sm" />
        <span>{automation.enabled ? t('status.active') : t('status.paused')}</span>
      </div>
      <div className="status-metrics">
        <div>
          <span>{t('status.schedule')}</span>
          <strong>{automationScheduleLabel(automation, t, locale)}</strong>
        </div>
        <div>
          <span>{t('status.nextRun')}</span>
          <strong>{automation.nextRunAt ? formatDate(automation.nextRunAt, locale) : t('status.notScheduled')}</strong>
        </div>
        <div>
          <span>{t('status.lastRan')}</span>
          <strong>{automation.lastRunAt ? formatDate(automation.lastRunAt, locale) : t('status.never')}</strong>
        </div>
        <div>
          <span>{t('form.provider')}</span>
          <strong>{runnerDetails.provider}</strong>
        </div>
        <div>
          <span>{t('form.model')}</span>
          <strong>{runnerDetails.model}</strong>
        </div>
        <div className={runnerDetails.showReasoning ? undefined : 'hidden'}>
          <span>{t('form.reasoningLevel')}</span>
          <strong>{runnerDetails.reasoning}</strong>
        </div>
        <div className={runnerDetails.showReview ? undefined : 'hidden'}>
          <span>{t('form.review')}</span>
          <strong>{runnerDetails.review}</strong>
        </div>
      </div>
    </aside>
  );
}
