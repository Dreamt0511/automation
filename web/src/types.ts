export type ScheduleDraft = {
  frequency: 'hourly' | 'daily' | 'weekdays' | 'weekly' | 'custom';
  timeOfDay: string;
  daysOfWeek: number[];
  cronExpression: string;
};

export type RunnerSettings = {
  provider?: string;
  model?: string;
  reasoningEffort?: string;
  permissionMode?: string;
};

export type Automation = {
  id: string;
  name: string;
  prompt: string;
  cwd: string;
  enabled: boolean;
  scheduleType: string;
  schedule: Record<string, unknown>;
  concurrency: string;
  runnerSettings: RunnerSettings;
  runnerArgs: string[];
  env: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  nextRunAt: string | null;
  lastRunAt?: string | null;
  activeRunId?: string | null;
  activeRunStatus?: string | null;
  unreviewedRunCount?: number;
  unreviewedFailedRunCount?: number;
};

export type AutomationRun = {
  id: string;
  automationId: string;
  trigger: string;
  runStatus: string;
  prompt: string;
  cwd: string;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  summary: string | null;
  error: string | null;
  taskStatus: string | null;
  artifactDir: string;
  agentSessionId?: string | null;
  agentProvider?: string | null;
  reviewedAt: string | null;
};

export type AppContext = {
  workspaceId: string;
  workspaceName: string;
  workspaceRoot: string;
  dataDir: string;
  logDir: string;
  runtimeDir: string;
};

export type RunnerReasoningLevel = {
  id?: string;
  effort?: string;
  value?: string;
  label?: string;
  name?: string;
  description?: string;
};

export type RunnerModel = {
  id: string;
  label?: string;
  name?: string;
  description?: string;
  current?: string;
  effective?: string;
  defaultValue?: string;
  defaultReasoningLevel?: string;
  reasoningLevels?: RunnerReasoningLevel[];
  permissionModes?: Array<{ id: string; label?: string }>;
};

export type RunnerProvider = {
  id?: string;
  provider?: string;
  label?: string;
  name?: string;
  status?: string;
};

export type RunnerPermissionMode = {
  id: string;
  label?: string;
  name?: string;
  description?: string;
  current?: boolean;
  effective?: boolean;
};

export type RunnerOptions = {
  available: boolean;
  provider?: string;
  defaultProvider?: string;
  currentModel?: string;
  currentReasoningLevel?: string;
  optionsUnavailable?: boolean;
  permissionMode?: string;
  models?: RunnerModel[];
  providers?: RunnerProvider[];
  permissionConfig?: {
    configurable?: boolean;
    defaultValue?: string;
    modes?: RunnerPermissionMode[];
  };
};

export type CwdOption = {
  id: string;
  label: string;
  path: string;
  kind?: string;
};

export type AutomationFormPayload = {
  name: string;
  cwd: string;
  prompt: string;
  enabled: boolean;
  scheduleType: string;
  schedule: Record<string, unknown>;
  concurrency: string;
  runnerSettings: RunnerSettings;
  runnerArgs: string[];
  env: Record<string, string>;
};

export type InboxFilter = 'all' | 'success' | 'fail' | 'skip';
