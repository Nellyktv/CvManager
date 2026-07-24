import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useCvList } from './useCvList';

const get = vi.fn();

vi.mock('../../api/axios.api', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
  },
}));

describe('useCvList', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('maps status and templateKey from the secured CV list payload', async () => {
    get.mockResolvedValue({
      data: {
        allCv: [
          {
            id: 7,
            version: 3,
            updatedAt: '2026-07-24T10:00:00.000Z',
            status: 'published',
            templateKey: 'structured-minimal',
            position: { title: 'Frontend Engineer' },
            user: { firstName: 'Artem', lastName: 'Ilyin' },
          },
        ],
      },
    });

    const { result } = renderHook(() => useCvList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(get).toHaveBeenCalledWith('/cv');
    expect(result.current.cvs).toEqual([
      expect.objectContaining({
        id: 7,
        candidate: 'Artem Ilyin',
        position: 'Frontend Engineer',
        status: 'published',
        templateKey: 'structured-minimal',
      }),
    ]);
  });

  it('falls back to draft when list payload omits status', async () => {
    get.mockResolvedValue({
      data: {
        allCv: [
          {
            id: 8,
            version: 1,
            updatedAt: '2026-07-24T10:00:00.000Z',
            status: null,
            templateKey: null,
            position: { title: 'Frontend Engineer' },
            user: { firstName: 'Artem', lastName: 'Ilyin' },
          },
        ],
      },
    });

    const { result } = renderHook(() => useCvList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cvs).toEqual([
      expect.objectContaining({
        id: 8,
        status: 'draft',
        templateKey: 'editorial-sidebar',
      }),
    ]);
  });
});

