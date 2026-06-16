import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  backendScheduleFromDraft,
  defaultScheduleDraft,
  scheduleLabelFromDraft,
} from '../lib/schedule';
import type { ScheduleDraft } from '../types';
import { templateDefinitions, templateScheduleDraft, type TemplateDefinition } from '../lib/templates';
import type {
  AppContext,
  Automation,
  AutomationFormPayload,
  CwdOption,
  RunnerOptions,
} from '../types';

type ConfigDialogProps = {
  automation: Automation | null;
  context: AppContext | null;
  runnerOptions: RunnerOptions;
  cwdOptions: CwdOption[];
  scheduleDraft: ScheduleDraft;
  error: string | null;
  onScheduleDraftChange: (draft: ScheduleDraft) => void;
  onClose: () => void;
  onSave: (payload: AutomationFormPayload) => void;
};

export function ConfigDialog({
  automation,
  context,
  runnerOptions,
  cwdOptions,
  scheduleDraft,
  error,
  onScheduleDraftChange,
  onClose,
  onSave,
}: ConfigDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState(automation?.name ?? '');
  const [prompt, setPrompt] = useState(automation?.prompt ?? '');
  const [cwd, setCwd] = useState(automation?.cwd ?? context?.workspaceRoot ?? '');
  const [provider, setProvider] = useState(automation?.runnerSettings?.provider ?? runnerOptions.provider ?? 'codex');
  const [model, setModel] = useState(automation?.runnerSettings?.model ?? runnerOptions.currentModel ?? '');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    setName(automation?.name ?? '');
    setPrompt(automation?.prompt ?? '');
    setCwd(automation?.cwd ?? context?.workspaceRoot ?? '');
    setProvider(automation?.runnerSettings?.provider ?? runnerOptions.provider ?? 'codex');
    setModel(automation?.runnerSettings?.model ?? runnerOptions.currentModel ?? '');
  }, [automation, context, runnerOptions]);

  const scheduleLabel = useMemo(() => scheduleLabelFromDraft(scheduleDraft, t), [scheduleDraft, t]);

  const applyTemplate = (template: TemplateDefinition) => {
    setName(t(template.nameKey));
    setPrompt(t(template.promptKey));
    onScheduleDraftChange(templateScheduleDraft(template));
  };

  const submit = () => {
    const scheduleConfig = backendScheduleFromDraft(scheduleDraft);
    onSave({
      name,
      prompt,
      cwd: cwd || context?.workspaceRoot || '',
      enabled: automation?.enabled ?? true,
      scheduleType: scheduleConfig.scheduleType,
      schedule: scheduleConfig.schedule,
      concurrency: 'queue',
      runnerSettings: {
        provider,
        model: model || undefined,
      },
      runnerArgs: automation?.runnerArgs ?? [],
      env: automation?.env ?? {},
    });
  };

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="configDialogTitle">
      <section className="config-dialog">
        <button
          className="ui-button ui-button-ghost ui-button-icon-sm dialog-close-button"
          type="button"
          aria-label={t('common.close')}
          onClick={onClose}
        >
          <X size={16} aria-hidden="true" />
        </button>

        {!automation ? (
          <aside className="template-panel" aria-label={t('aria.templates')}>
            <div className="template-panel-header">
              <h2>{t('templates.title')}</h2>
            </div>
            <div className="template-list">
              {templateDefinitions.map((template) => (
                <button
                  key={template.id}
                  className="template-card"
                  type="button"
                  onClick={() => applyTemplate(template)}
                >
                  <strong>{t(template.nameKey)}</strong>
                  <span>{t(template.titleKey)}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        <section className="config-panel">
          <header className="config-header">
            <h2 id="configDialogTitle">{automation ? t('common.edit') : t('common.createAutomation')}</h2>
          </header>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="form-scroll">
            <div className="config-form-fields">
              <label className="field">
                <span>{t('form.title')}</span>
                <input
                  className="title-input"
                  value={name}
                  autoComplete="off"
                  placeholder={t('form.titlePlaceholder')}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className="field">
                <span>{t('form.prompt')}</span>
                <textarea
                  className="prompt-input"
                  rows={4}
                  value={prompt}
                  placeholder={t('form.promptPlaceholder')}
                  onChange={(event) => setPrompt(event.target.value)}
                />
              </label>

              <div className="config-toolbar">
                <label className="field inline-select-field">
                  <span>{t('aria.workingDirectory')}</span>
                  <select value={cwd} onChange={(event) => setCwd(event.target.value)}>
                    {cwdOptions.map((option) => (
                      <option key={option.id} value={option.path}>
                        {option.label}
                      </option>
                    ))}
                    {cwd && !cwdOptions.some((option) => option.path === cwd) ? (
                      <option value={cwd}>{cwd}</option>
                    ) : null}
                  </select>
                </label>

                <span className="schedule-tool">
                  <button
                    className="tool-button"
                    type="button"
                    aria-expanded={scheduleOpen}
                    onClick={() => setScheduleOpen((open) => !open)}
                  >
                    {scheduleLabel}
                  </button>
                </span>

                {runnerOptions.available ? (
                  <div className="runner-options">
                    <label className="field inline-select-field">
                      <span>{t('form.provider')}</span>
                      <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                        {(runnerOptions.providers ?? [{ id: provider, label: provider }]).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label ?? item.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field inline-select-field">
                      <span>{t('form.model')}</span>
                      <select value={model} onChange={(event) => setModel(event.target.value)}>
                        {(runnerOptions.models ?? []).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label ?? item.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              {scheduleOpen ? (
                <section className="schedule-panel" aria-label={t('aria.schedule')}>
                  <div className="schedule-section">
                    <span className="schedule-section-label">{t('form.schedule')}</span>
                    <div className="schedule-segments" role="radiogroup" aria-label={t('aria.scheduleFrequency')}>
                      {(['hourly', 'daily', 'weekdays', 'weekly'] as const).map((frequency) => (
                        <button
                          key={frequency}
                          className={`schedule-segment ${scheduleDraft.frequency === frequency ? 'active' : ''}`}
                          type="button"
                          role="radio"
                          aria-checked={scheduleDraft.frequency === frequency}
                          onClick={() =>
                            onScheduleDraftChange({
                              ...defaultScheduleDraft,
                              frequency,
                              timeOfDay: scheduleDraft.timeOfDay,
                              daysOfWeek: scheduleDraft.daysOfWeek,
                            })
                          }
                        >
                          {t(`schedule.frequency.${frequency}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {scheduleDraft.frequency !== 'hourly' ? (
                    <label className="schedule-time-field">
                      <span className="schedule-section-label">{t('form.time')}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={5}
                        value={scheduleDraft.timeOfDay}
                        placeholder="09:00"
                        onChange={(event) =>
                          onScheduleDraftChange({ ...scheduleDraft, timeOfDay: event.target.value })
                        }
                      />
                    </label>
                  ) : null}
                  {scheduleDraft.frequency === 'weekly' ? (
                    <div className="schedule-section">
                      <span className="schedule-section-label">{t('form.days')}</span>
                      <div className="schedule-day-grid" role="group" aria-label={t('aria.weeklyDays')}>
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                          const active = scheduleDraft.daysOfWeek.includes(day);
                          const dayKeys = [
                            'monday',
                            'tuesday',
                            'wednesday',
                            'thursday',
                            'friday',
                            'saturday',
                            'sunday',
                          ] as const;
                          return (
                            <button
                              key={day}
                              className={`schedule-day ${active ? 'active' : ''}`}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                onScheduleDraftChange({
                                  ...scheduleDraft,
                                  daysOfWeek: active
                                    ? scheduleDraft.daysOfWeek.filter((value: number) => value !== day)
                                    : [...scheduleDraft.daysOfWeek, day].sort((a, b) => a - b),
                                })
                              }
                            >
                              {t(`schedule.day.${dayKeys[day - 1]}Short`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          <footer className="config-footer">
            <div className="form-controls">
              <button
                className="ui-button ui-button-ghost ui-button-dialog"
                type="button"
                onClick={onClose}
              >
                {t('common.cancel')}
              </button>
              <button
                className="ui-button ui-button-default ui-button-dialog"
                type="button"
                onClick={submit}
              >
                {automation ? t('common.save') : t('common.create')}
              </button>
            </div>
          </footer>
        </section>
      </section>
    </div>
  );
}
