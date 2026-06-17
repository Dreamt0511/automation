import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { AppHeader } from './components/AppHeader';
import { AutomationList } from './components/AutomationList';
import { ConfigDialog } from './components/ConfigDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { InboxView } from './components/InboxView';
import { useDetailInfoPopover } from './hooks/useDetailInfoPopover';
import { useI18n } from './i18n';
import type {
  AppContext,
  Automation,
  AutomationFormPayload,
  AutomationRun,
  CwdOption,
  InboxFilter,
  RunnerOptions,
  ScheduleDraft,
} from './types';
import type { TemplateDefinition } from './lib/templates';
import { templateScheduleDraft } from './lib/templates';
import { defaultScheduleDraft, scheduleDraftFromAutomation } from './lib/schedule';

type LoadState = {
  automations: Automation[];
  runs: AutomationRun[];
  context: AppContext | null;
  runnerOptions: RunnerOptions;
  cwdOptions: CwdOption[];
  isLoadingAutomations: boolean;
  isLoadingRuns: boolean;
};

const initialLoadState: LoadState = {
  automations: [],
  runs: [],
  context: null,
  runnerOptions: { available: false, models: [] },
  cwdOptions: [],
  isLoadingAutomations: true,
  isLoadingRuns: false,
};

export function App() {
  const { locale, t } = useI18n();
  const [state, setState] = useState<LoadState>(initialLoadState);
  const [error, setError] = useState<string | null>(null);
  const [inboxAutomationId, setInboxAutomationId] = useState<string | null>(null);
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [configOpen, setConfigOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [createTemplate, setCreateTemplate] = useState<TemplateDefinition | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(defaultScheduleDraft);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);

  const inboxAutomation = useMemo(
    () => state.automations.find((item) => item.id === inboxAutomationId) ?? null,
    [inboxAutomationId, state.automations],
  );

  const filteredRuns = useMemo(() => {
    if (inboxFilter === 'all') return state.runs;
    if (inboxFilter === 'success') return state.runs.filter((run) => run.taskStatus === 'success');
    if (inboxFilter === 'fail') return state.runs.filter((run) => run.taskStatus === 'fail');
    return state.runs.filter((run) => run.taskStatus === 'skip');
  }, [inboxFilter, state.runs]);

  const loadAutomations = useCallback(async () => {
    setState((current) => ({ ...current, isLoadingAutomations: true }));
    try {
      const [automationsResult, contextResult, runnerOptionsResult, cwdOptionsResult] = await Promise.allSettled([
        api<{ automations: Automation[] }>('/api/automations'),
        api<AppContext>('/api/context'),
        api<RunnerOptions>(`/api/runner-options?locale=${encodeURIComponent(locale)}`),
        api<{ directories: CwdOption[] }>('/api/cwd-options'),
      ]);
      if (automationsResult.status === 'rejected') {
        throw automationsResult.reason;
      }
      if (runnerOptionsResult.status === 'rejected') {
        setError(runnerOptionsResult.reason instanceof Error ? runnerOptionsResult.reason.message : t('request.failed'));
      }
      setState((current) => ({
        ...current,
        automations: automationsResult.value.automations,
        context: contextResult.status === 'fulfilled' ? contextResult.value : current.context,
        runnerOptions: runnerOptionsResult.status === 'fulfilled' ? runnerOptionsResult.value : current.runnerOptions,
        cwdOptions: cwdOptionsResult.status === 'fulfilled' ? cwdOptionsResult.value.directories : current.cwdOptions,
        isLoadingAutomations: false,
      }));
    } catch (loadError) {
      setState((current) => ({ ...current, isLoadingAutomations: false }));
      setError(loadError instanceof Error ? loadError.message : t('request.failed'));
    }
  }, [locale, t]);

  const loadRuns = useCallback(
    async (automationId: string) => {
      setState((current) => ({ ...current, isLoadingRuns: true }));
      try {
        const response = await api<{ runs: AutomationRun[] }>(
          `/api/runs?automationId=${encodeURIComponent(automationId)}`,
        );
        const reviewed = await markLoadedRunsReviewed(response.runs);
        setState((current) => ({ ...current, runs: response.runs, isLoadingRuns: false }));
        if (reviewed) {
          await loadAutomations();
        }
      } catch (loadError) {
        setState((current) => ({ ...current, isLoadingRuns: false }));
        setError(loadError instanceof Error ? loadError.message : t('request.failed'));
      }
    },
    [loadAutomations, t],
  );

  const detailInfo = useDetailInfoPopover({ enabled: Boolean(inboxAutomationId) });

  useEffect(() => {
    void loadAutomations();
  }, [loadAutomations]);

  useEffect(() => {
    if (!inboxAutomationId) {
      setState((current) => ({ ...current, runs: [] }));
      return;
    }
    void loadRuns(inboxAutomationId);
  }, [inboxAutomationId, loadRuns]);

  useEffect(() => {
    document.body.classList.toggle('inbox-open', Boolean(inboxAutomationId));
    return () => {
      document.body.classList.remove('inbox-open');
    };
  }, [inboxAutomationId]);

  useEffect(() => {
    const hasActive = state.automations.some(
      (item) => item.activeRunId && ['queued', 'running', 'canceling'].includes(item.activeRunStatus ?? ''),
    );
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      void loadAutomations();
      if (inboxAutomationId) void loadRuns(inboxAutomationId);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [inboxAutomationId, loadAutomations, loadRuns, state.automations]);

  const openCreateDialog = (template?: TemplateDefinition) => {
    setEditingAutomation(null);
    setCreateTemplate(template ?? null);
    setScheduleDraft(template ? templateScheduleDraft(template) : defaultScheduleDraft);
    setConfigOpen(true);
    setError(null);
  };

  const openEditDialog = (automation: Automation) => {
    setEditingAutomation(automation);
    setCreateTemplate(null);
    setScheduleDraft(scheduleDraftFromAutomation(automation));
    setConfigOpen(true);
    setError(null);
  };

  const saveAutomation = async (payload: AutomationFormPayload) => {
    try {
      if (editingAutomation) {
        await api(`/api/automations/${encodeURIComponent(editingAutomation.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/api/automations', { method: 'POST', body: JSON.stringify(payload) });
      }
      setConfigOpen(false);
      setEditingAutomation(null);
      setCreateTemplate(null);
      await loadAutomations();
      if (inboxAutomationId) await loadRuns(inboxAutomationId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('request.failed'));
    }
  };

  const deleteAutomation = async (automation: Automation) => {
    await api(`/api/automations/${encodeURIComponent(automation.id)}`, { method: 'DELETE' });
    if (inboxAutomationId === automation.id) setInboxAutomationId(null);
    setDeleteTarget(null);
    await loadAutomations();
  };

  const runAutomation = async (automation: Automation) => {
    await api(`/api/automations/${encodeURIComponent(automation.id)}/run`, { method: 'POST' });
    await loadAutomations();
    if (inboxAutomationId === automation.id) await loadRuns(automation.id);
  };

  const toggleAutomationEnabled = async (automation: Automation, enabled: boolean) => {
    const action = enabled ? 'resume' : 'pause';
    await api(`/api/automations/${encodeURIComponent(automation.id)}/${action}`, { method: 'POST' });
    await loadAutomations();
  };

  const openInbox = (automationId: string) => {
    detailInfo.close({ immediate: true });
    setInboxAutomationId(automationId);
    setInboxFilter('all');
  };

  return (
    <main className="app-shell">
      <AppHeader
        inboxAutomation={inboxAutomation}
        showCreate={state.automations.length > 0 && !inboxAutomationId}
        onCreate={() => openCreateDialog()}
        onEdit={() => inboxAutomation && openEditDialog(inboxAutomation)}
        onDelete={() => inboxAutomation && setDeleteTarget(inboxAutomation)}
        onRun={() => inboxAutomation && void runAutomation(inboxAutomation)}
        onBack={() => {
          detailInfo.close({ immediate: true });
          setInboxAutomationId(null);
        }}
      />

      {!inboxAutomationId ? (
        <AutomationList
          automations={state.automations}
          isLoading={state.isLoadingAutomations}
          onCreate={openCreateDialog}
          onOpenInbox={openInbox}
          onEdit={openEditDialog}
          onDelete={setDeleteTarget}
          onRun={(automation) => void runAutomation(automation)}
          onToggleEnabled={(automation, enabled) => void toggleAutomationEnabled(automation, enabled)}
        />
      ) : (
        <InboxView
          automation={inboxAutomation}
          runs={filteredRuns}
          filter={inboxFilter}
          isLoading={state.isLoadingRuns}
          runnerOptions={state.runnerOptions}
          statusSectionRef={detailInfo.statusSectionRef}
          infoButtonRef={detailInfo.infoButtonRef}
          detailInfoOpen={detailInfo.isOpen}
          onFilterChange={setInboxFilter}
          onRefresh={() => inboxAutomationId && void loadRuns(inboxAutomationId)}
          onToggleDetailInfo={detailInfo.toggle}
          onStatusSectionClick={(event) => event.stopPropagation()}
        />
      )}

      {configOpen ? (
        <ConfigDialog
          automation={editingAutomation}
          initialTemplate={createTemplate}
          context={state.context}
          runnerOptions={state.runnerOptions}
          cwdOptions={state.cwdOptions}
          scheduleDraft={scheduleDraft}
          error={error}
          onScheduleDraftChange={setScheduleDraft}
          onClose={() => {
            setConfigOpen(false);
            setEditingAutomation(null);
            setCreateTemplate(null);
            setError(null);
          }}
          onSave={(payload) => void saveAutomation(payload)}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteConfirmDialog
          automation={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deleteAutomation(deleteTarget)}
        />
      ) : null}
    </main>
  );
}

async function markLoadedRunsReviewed(runs: AutomationRun[]): Promise<boolean> {
  const reviewableRuns = runs.filter((run) => run.finishedAt && !run.reviewedAt);
  if (!reviewableRuns.length) return false;
  const reviewedAt = new Date().toISOString();
  await Promise.all(
    reviewableRuns.map((run) =>
      api(`/api/runs/${encodeURIComponent(run.id)}/review`, { method: 'POST' }),
    ),
  );
  for (const run of reviewableRuns) {
    run.reviewedAt = reviewedAt;
  }
  return true;
}
