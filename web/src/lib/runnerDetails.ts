import type {
  Automation,
  RunnerModel,
  RunnerOptions,
  RunnerPermissionMode,
  RunnerProvider,
  RunnerReasoningLevel,
} from '../types';

export type RunnerDisplayDetails = {
  provider: string;
  model: string;
  reasoning: string;
  review: string;
  showReasoning: boolean;
  showReview: boolean;
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function titleize(value: string): string {
  if (!value) return value;
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function optionLabel(
  option: { label?: string; name?: string; id?: string } | null | undefined,
  fallback: string,
): string {
  return normalizeText(option?.label) || normalizeText(option?.name) || normalizeText(option?.id) || fallback;
}

function parseRunnerArgs(args: readonly string[]) {
  const result = { model: '', reasoningEffort: '' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';
    if ((arg === '--model' || arg === '-m') && args[index + 1]) {
      result.model = args[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (arg.startsWith('--model=')) {
      result.model = arg.slice('--model='.length);
      continue;
    }
    if ((arg === '--config' || arg === '-c') && args[index + 1]) {
      readReasoningConfig(args[index + 1] ?? '', result);
      index += 1;
      continue;
    }
    if (arg.startsWith('--config=')) readReasoningConfig(arg.slice('--config='.length), result);
  }
  return result;
}

function readReasoningConfig(value: string, result: { reasoningEffort: string }) {
  const match = value.match(/^model_reasoning_effort=(.*)$/);
  if (match) result.reasoningEffort = (match[1] ?? '').replace(/^["']|["']$/g, '');
}

function runnerProviders(runnerOptions: RunnerOptions): RunnerProvider[] {
  const providers = runnerOptions.providers ?? [];
  return providers.length > 0 ? providers : [{ provider: runnerOptions.provider || 'codex' }];
}

function runnerProviderId(provider?: RunnerProvider | null): string {
  return normalizeText(provider?.provider) || normalizeText(provider?.id);
}

function runnerReasoningId(reasoning?: RunnerReasoningLevel | null): string {
  return normalizeText(reasoning?.effort) || normalizeText(reasoning?.value) || normalizeText(reasoning?.id);
}

function providerLabel(provider?: RunnerProvider | null): string {
  const explicit = normalizeText(provider?.label) || normalizeText(provider?.name);
  if (explicit) return explicit;
  return titleize(runnerProviderId(provider) || 'codex');
}

function providerLabelForId(providerId: string, runnerOptions: RunnerOptions): string {
  const matched = runnerProviders(runnerOptions).find((item) => runnerProviderId(item) === providerId);
  return providerLabel(matched ?? { provider: providerId });
}

function modelLabel(model: RunnerModel | null | undefined, t: (key: string) => string): string {
  return optionLabel(model, model?.id || t('common.default'));
}

function reasoningLabel(
  reasoning: RunnerReasoningLevel | string | null | undefined,
  t: (key: string) => string,
): string {
  if (typeof reasoning === 'string') {
    const messageKey = `reasoning.${reasoning.toLowerCase()}`;
    const translated = t(messageKey);
    return translated === messageKey ? titleize(reasoning) : translated;
  }
  const explicit = optionLabel(reasoning, '');
  if (explicit) return explicit;
  const id = runnerReasoningId(reasoning);
  const messageKey = `reasoning.${id.toLowerCase()}`;
  const translated = t(messageKey);
  return translated === messageKey ? titleize(id) : translated;
}

function permissionModeLabel(
  mode: RunnerPermissionMode | string | null | undefined,
  t: (key: string) => string,
): string {
  if (typeof mode === 'string') {
    const messageKey = `permission.${mode}`;
    const translated = t(messageKey);
    return translated === messageKey ? titleize(mode) : translated;
  }
  const explicit = optionLabel(mode, '');
  if (explicit) return explicit;
  const id = normalizeText(mode?.id);
  const messageKey = `permission.${id}`;
  const translated = t(messageKey);
  return translated === messageKey ? titleize(id) : translated;
}

function findRunnerModel(runnerOptions: RunnerOptions, modelId: string): RunnerModel | null {
  return runnerOptions.models?.find((item) => item.id === modelId) ?? runnerOptions.models?.[0] ?? null;
}

function findReasoningLevel(
  runnerOptions: RunnerOptions,
  reasoningId: string,
  model?: RunnerModel | null,
): RunnerReasoningLevel | null {
  const levels = model?.reasoningLevels ?? runnerOptions.models?.[0]?.reasoningLevels ?? [];
  return levels.find((item) => runnerReasoningId(item) === reasoningId) ?? null;
}

function findPermissionMode(
  runnerOptions: RunnerOptions,
  modeId: string,
): RunnerPermissionMode | null {
  return runnerOptions.permissionConfig?.modes?.find((item) => normalizeText(item.id) === modeId) ?? null;
}

function resolveRunnerSelection(
  automation: Pick<Automation, 'runnerSettings' | 'runnerArgs'>,
  runnerOptions: RunnerOptions,
) {
  const parsed = parseRunnerArgs(automation.runnerArgs ?? []);
  const providers = runnerProviders(runnerOptions);
  const preferredProvider = normalizeText(automation.runnerSettings?.provider);
  const provider =
    preferredProvider && providers.some((item) => runnerProviderId(item) === preferredProvider) ?
      preferredProvider
    : preferredProvider ||
      normalizeText(runnerOptions.provider) ||
      normalizeText(runnerOptions.defaultProvider) ||
      runnerProviderId(providers[0]) ||
      'codex';
  const runnerOptionsMatchProvider =
    !normalizeText(runnerOptions.provider) || normalizeText(runnerOptions.provider) === provider;
  const model =
    normalizeText(automation.runnerSettings?.model) ||
    parsed.model ||
    (runnerOptionsMatchProvider ? normalizeText(runnerOptions.currentModel) : '') ||
    (runnerOptionsMatchProvider ? runnerOptions.models?.[0]?.id ?? '' : '') ||
    '';
  const selectedModel = runnerOptionsMatchProvider ? findRunnerModel(runnerOptions, model) : null;
  const reasoningEffort =
    normalizeText(automation.runnerSettings?.reasoningEffort) ||
    parsed.reasoningEffort ||
    (runnerOptionsMatchProvider ? normalizeText(runnerOptions.currentReasoningLevel) : '') ||
    (runnerOptionsMatchProvider ? normalizeText(selectedModel?.defaultReasoningLevel) : '') ||
    (runnerOptionsMatchProvider ? runnerReasoningId(selectedModel?.reasoningLevels?.[0]) : '') ||
    '';
  const permissionMode =
    normalizeText(automation.runnerSettings?.permissionMode) ||
    (runnerOptionsMatchProvider ? normalizeText(runnerOptions.permissionMode) : '') ||
    (runnerOptionsMatchProvider ? normalizeText(runnerOptions.permissionConfig?.defaultValue) : '') ||
    (runnerOptionsMatchProvider ?
      runnerOptions.permissionConfig?.modes?.find((item) => item.current || item.effective)?.id
    : '') ||
    (runnerOptionsMatchProvider ? runnerOptions.permissionConfig?.modes?.[0]?.id ?? '' : '') ||
    '';
  return { provider, model, reasoningEffort, permissionMode, selectedModel };
}

export function runnerDetailsFromSettings(
  automation: Pick<Automation, 'runnerSettings' | 'runnerArgs'>,
  runnerOptions: RunnerOptions,
  t: (key: string) => string,
): RunnerDisplayDetails {
  const selection = resolveRunnerSelection(automation, runnerOptions);
  const provider = providerLabelForId(selection.provider, runnerOptions);
  const reasoningId = selection.reasoningEffort;
  const reviewMode = selection.permissionMode;

  if (!runnerOptions.available) {
    const reasoning = reasoningId ? reasoningLabel(reasoningId, t) : '';
    const review = reviewMode ? permissionModeLabel(reviewMode, t) : '';
    return {
      provider,
      model: selection.model || t('common.default'),
      reasoning,
      review,
      showReasoning: Boolean(reasoning),
      showReview: Boolean(review),
    };
  }

  const model = selection.selectedModel;
  const reasoning = reasoningId
    ? reasoningLabel(findReasoningLevel(runnerOptions, reasoningId, model) ?? reasoningId, t)
    : '';
  const review = reviewMode
    ? permissionModeLabel(findPermissionMode(runnerOptions, reviewMode) ?? reviewMode, t)
    : '';

  return {
    provider,
    model: model ? modelLabel(model, t) : selection.model || t('common.default'),
    reasoning,
    review,
    showReasoning: Boolean(reasoning),
    showReview: Boolean(review),
  };
}
