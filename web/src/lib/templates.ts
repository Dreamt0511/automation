import type { ScheduleDraft } from '../types';
import { schedulePresets } from './schedule';

export type TemplateDefinition = {
  id: string;
  icon: TemplateIconName;
  titleKey: string;
  nameKey: string;
  promptKey: string;
  schedulePreset: keyof typeof schedulePresets;
};

export type TemplateIconName =
  | 'book-open'
  | 'bug'
  | 'chart-bar'
  | 'circle-check'
  | 'file-text'
  | 'message-circle'
  | 'network'
  | 'puzzle'
  | 'star'
  | 'target';

export const templateDefinitions: TemplateDefinition[] = [
  {
    id: 'bug-scan',
    icon: 'bug',
    titleKey: 'template.bugScan.title',
    nameKey: 'template.bugScan.name',
    promptKey: 'template.bugScan.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'release-notes',
    icon: 'book-open',
    titleKey: 'template.releaseNotes.title',
    nameKey: 'template.releaseNotes.name',
    promptKey: 'template.releaseNotes.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'standup',
    icon: 'message-circle',
    titleKey: 'template.standup.title',
    nameKey: 'template.standup.name',
    promptKey: 'template.standup.prompt',
    schedulePreset: 'weekday-0900',
  },
  {
    id: 'ci',
    icon: 'target',
    titleKey: 'template.ci.title',
    nameKey: 'template.ci.name',
    promptKey: 'template.ci.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'game',
    icon: 'star',
    titleKey: 'template.game.title',
    nameKey: 'template.game.name',
    promptKey: 'template.game.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'skills',
    icon: 'network',
    titleKey: 'template.skills.title',
    nameKey: 'template.skills.name',
    promptKey: 'template.skills.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'weekly-update',
    icon: 'file-text',
    titleKey: 'template.weeklyUpdate.title',
    nameKey: 'template.weeklyUpdate.name',
    promptKey: 'template.weeklyUpdate.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'regression',
    icon: 'chart-bar',
    titleKey: 'template.regression.title',
    nameKey: 'template.regression.name',
    promptKey: 'template.regression.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'review-ready',
    icon: 'circle-check',
    titleKey: 'template.reviewReady.title',
    nameKey: 'template.reviewReady.name',
    promptKey: 'template.reviewReady.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'cleanup',
    icon: 'puzzle',
    titleKey: 'template.cleanup.title',
    nameKey: 'template.cleanup.name',
    promptKey: 'template.cleanup.prompt',
    schedulePreset: 'weekly-0900',
  },
];

export const emptyStateTemplateIds = ['bug-scan', 'release-notes', 'standup', 'ci'] as const;

export function featuredEmptyTemplates(): TemplateDefinition[] {
  return emptyStateTemplateIds
    .map((id) => templateDefinitions.find((template) => template.id === id))
    .filter((template): template is TemplateDefinition => template !== undefined);
}

export function templateScheduleDraft(template: TemplateDefinition): ScheduleDraft {
  return schedulePresets[template.schedulePreset];
}
