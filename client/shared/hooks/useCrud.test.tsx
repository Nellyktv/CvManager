import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';

import i18n from '../i18n/translate';
import { useCrud } from './useCrud';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../api/axios.api', () => ({
  api: apiMock,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <SnackbarProvider>{children}</SnackbarProvider>
  </I18nextProvider>
);

describe('useCrud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({ data: { projects: [] } });
    apiMock.post.mockResolvedValue({ data: {} });
    apiMock.put.mockResolvedValue({ data: {} });
  });

  it('exposes saving state and reports mutation success or failure', async () => {
    let rejectPost!: (error: Error) => void;
    apiMock.post.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectPost = reject;
        }),
    );

    const { result } = renderHook(() => useCrud('/project', 'projects'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let createPromise!: Promise<boolean>;
    act(() => {
      createPromise = result.current.createItem({ title: 'X' });
    });

    await waitFor(() => expect(result.current.saving).toBe(true));

    let created = false;
    await act(async () => {
      rejectPost(new Error('fail'));
      created = await createPromise;
    });

    expect(created).toBe(false);
    await waitFor(() => expect(result.current.saving).toBe(false));

    apiMock.post.mockResolvedValueOnce({ data: {} });

    await act(async () => {
      created = await result.current.createItem({ title: 'Y' });
    });

    expect(created).toBe(true);
    expect(result.current.saving).toBe(false);
  });
});
