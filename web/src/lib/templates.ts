import type { ScheduleDraft } from '../types';
import { schedulePresets } from './schedule';

export type TemplateDefinition = {
  id: string;
  titleKey: string;
  nameKey: string;
  promptKey: string;
  schedulePreset: keyof typeof schedulePresets;
};

export const templateDefinitions: TemplateDefinition[] = [
  {
    id: 'bug-scan',
    titleKey: 'template.bugScan.title',
    nameKey: 'template.bugScan.name',
    promptKey: 'template.bugScan.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'release-notes',
    titleKey: 'template.releaseNotes.title',
    nameKey: 'template.releaseNotes.name',
    promptKey: 'template.releaseNotes.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'standup',
    titleKey: 'template.standup.title',
    nameKey: 'template.standup.name',
    promptKey: 'template.standup.prompt',
    schedulePreset: 'weekday-0900',
  },
  {
    id: 'ci',
    titleKey: 'template.ci.title',
    nameKey: 'template.ci.name',
    promptKey: 'template.ci.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'game',
    titleKey: 'template.game.title',
    nameKey: 'template.game.name',
    promptKey: 'template.game.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'skills',
    titleKey: 'template.skills.title',
    nameKey: 'template.skills.name',
    promptKey: 'template.skills.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'weekly-update',
    titleKey: 'template.weeklyUpdate.title',
    nameKey: 'template.weeklyUpdate.name',
    promptKey: 'template.weeklyUpdate.prompt',
    schedulePreset: 'weekly-0900',
  },
  {
    id: 'regression',
    titleKey: 'template.regression.title',
    nameKey: 'template.regression.name',
    promptKey: 'template.regression.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'review-ready',
    titleKey: 'template.reviewReady.title',
    nameKey: 'template.reviewReady.name',
    promptKey: 'template.reviewReady.prompt',
    schedulePreset: 'daily-0900',
  },
  {
    id: 'cleanup',
    titleKey: 'template.cleanup.title',
    nameKey: 'template.cleanup.name',
    promptKey: 'template.cleanup.prompt',
    schedulePreset: 'weekly-0900',
  },
];

export function templateScheduleDraft(template: TemplateDefinition): ScheduleDraft {
  return schedulePresets[template.schedulePreset];
}
