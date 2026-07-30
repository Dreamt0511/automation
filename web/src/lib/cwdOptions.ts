import type { CwdOption } from '../types';

type RegisteredProject = {
  id: string;
  label: string;
  path: string;
};

export function mergeCwdOptions(
  appDirectories: readonly CwdOption[],
  registeredProjects: readonly RegisteredProject[],
): CwdOption[] {
  const options = [...appDirectories];
  const seenPaths = new Set(options.map((option) => option.path));

  for (const project of registeredProjects) {
    const path = project.path.trim();
    if (!path || seenPaths.has(path)) continue;
    seenPaths.add(path);
    options.push({
      id: `registered:${project.id}`,
      kind: 'registered-project',
      label: project.label.trim() || path,
      path,
    });
  }

  return options;
}

export function reconcileCwdOptions(
  current: readonly CwdOption[],
  appDirectories: readonly CwdOption[] | undefined,
  registeredProjects: readonly RegisteredProject[] | undefined,
): CwdOption[] {
  if (!appDirectories && !registeredProjects) return [...current];

  const nextAppDirectories =
    appDirectories ?? current.filter((option) => option.kind !== 'registered-project');
  const nextRegisteredProjects =
    registeredProjects ??
    current
      .filter((option) => option.kind === 'registered-project')
      .map((option) => ({
        id: option.id.replace(/^registered:/, ''),
        label: option.label,
        path: option.path,
      }));

  return mergeCwdOptions(nextAppDirectories, nextRegisteredProjects);
}

export async function listRegisteredProjects(): Promise<RegisteredProject[]> {
  const userProjects = window.tuttiExternal?.userProjects;
  if (!userProjects) return [];
  const result = await userProjects.list();
  return result.projects;
}
