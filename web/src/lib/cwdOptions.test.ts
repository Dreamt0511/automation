import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CwdOption } from '../types';
import { listRegisteredProjects, mergeCwdOptions, reconcileCwdOptions } from './cwdOptions';

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
      {
        id: 'registered:one',
        kind: 'registered-project',
        label: 'One',
        path: '/projects/one',
      },
      {
        id: 'registered:two',
        kind: 'registered-project',
        label: 'Two',
        path: '/projects/two',
      },
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
        kind: 'registered-project',
        label: '/projects/fallback',
        path: '/projects/fallback',
      },
    ]);
  });
});

describe('reconcileCwdOptions', () => {
  const current: CwdOption[] = [
    {
      id: 'agent-workspace',
      kind: 'workspace',
      label: 'agent-workspace',
      path: '/runtime/agent-workspace',
    },
    { id: 'registered:old', kind: 'registered-project', label: 'Old', path: '/projects/old' },
  ];

  it('uses fresh registered projects when app directories fail to load', () => {
    expect(
      reconcileCwdOptions(current, undefined, [{ id: 'new', label: 'New', path: '/projects/new' }]),
    ).toEqual([
      current[0],
      { id: 'registered:new', kind: 'registered-project', label: 'New', path: '/projects/new' },
    ]);
  });

  it('keeps registered projects when app directories load but the bridge fails', () => {
    const appDirectories = [
      {
        id: 'new-workspace',
        kind: 'workspace',
        label: 'new-workspace',
        path: '/runtime/new-workspace',
      },
    ];

    expect(reconcileCwdOptions(current, appDirectories, undefined)).toEqual([
      ...appDirectories,
      current[1],
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
