import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CwdOption } from '../types';
import { listRegisteredProjects, mergeCwdOptions } from './cwdOptions';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mergeCwdOptions', () => {
  it('adds every registered project after the app-owned directory', () => {
    const appDirectories: CwdOption[] = [
      {
        id: 'agent-workspace',
        kind: 'workspace',
        label: 'agent-workspace',
        path: '/runtime/agent-workspace',
      },
    ];

    expect(
      mergeCwdOptions(appDirectories, [
        { id: 'one', label: 'One', path: '/projects/one' },
        { id: 'two', label: 'Two', path: '/projects/two' },
      ]),
    ).toEqual([
      ...appDirectories,
      { id: 'registered:one', kind: 'project', label: 'One', path: '/projects/one' },
      { id: 'registered:two', kind: 'project', label: 'Two', path: '/projects/two' },
    ]);
  });

  it('deduplicates paths and ignores empty registered paths', () => {
    const appDirectories: CwdOption[] = [
      {
        id: 'agent-workspace',
        label: 'agent-workspace',
        path: '/runtime/agent-workspace',
      },
    ];

    expect(
      mergeCwdOptions(appDirectories, [
        { id: 'duplicate', label: 'Duplicate', path: '/runtime/agent-workspace' },
        { id: 'empty', label: 'Empty', path: ' ' },
        { id: 'fallback-label', label: ' ', path: '/projects/fallback' },
      ]),
    ).toEqual([
      ...appDirectories,
      {
        id: 'registered:fallback-label',
        kind: 'project',
        label: '/projects/fallback',
        path: '/projects/fallback',
      },
    ]);
  });
});

describe('listRegisteredProjects', () => {
  it('loads projects from the Tutti external bridge', async () => {
    const projects = [{ id: 'one', label: 'One', path: '/projects/one' }];
    const list = vi.fn().mockResolvedValue({ projects });
    vi.stubGlobal('window', { tuttiExternal: { userProjects: { list } } });

    await expect(listRegisteredProjects()).resolves.toEqual(projects);
    expect(list).toHaveBeenCalledOnce();
  });

  it('returns no projects when the bridge is unavailable', async () => {
    vi.stubGlobal('window', {});

    await expect(listRegisteredProjects()).resolves.toEqual([]);
  });
});
