import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';

import i18n from '../../../shared/i18n/translate';
import { cvContentFixture } from '../fixtures/cvContent.fixture';
import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import { useCvWorkspace } from './useCvWorkspace';

const getCv = vi.hoisted(() => vi.fn());
const updateCv = vi.hoisted(() => vi.fn());
const refreshCv = vi.hoisted(() => vi.fn());
const publishCv = vi.hoisted(() => vi.fn());

vi.mock('../../../api/cv.api', () => ({
  getCv,
  updateCv,
  refreshCv,
  publishCv,
}));

vi.mock('../../../store/UserStore', () => ({
  default: (selector: (state: { user: { id: number; role: string } }) => unknown) =>
    selector({ user: { id: 7, role: 'CANDIDATE' } }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <SnackbarProvider>{children}</SnackbarProvider>
  </I18nextProvider>
);

const baseCv = {
  id: 42,
  version: 1,
  status: 'draft',
  userId: 7,
  templateKey: 'editorial-sidebar' as CvTemplateKey,
  content: cvContentFixture,
  position: { id: 1, title: 'Frontend Engineer' },
  user: { id: 7, firstName: 'Artem', lastName: 'Ilyin' },
};

describe('useCvWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.resetAllMocks();
    getCv.mockResolvedValue({ cv: structuredClone(baseCv) });
    updateCv.mockImplementation(async (_id: string, patch: { content?: CvContent; templateKey?: string }) => ({
      cv: {
        ...baseCv,
        ...(patch.content ? { content: patch.content } : {}),
        ...(patch.templateKey ? { templateKey: patch.templateKey } : {}),
      },
    }));
    refreshCv.mockResolvedValue({
      cv: {
        ...baseCv,
        content: {
          ...cvContentFixture,
          skills: [{ label: 'RefreshedSkill' }],
        },
      },
      refreshedAt: '2026-07-24T12:00:00.000Z',
    });
    publishCv.mockResolvedValue({ message: 'CV published' });
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (i18n.language !== 'en') {
      await i18n.changeLanguage('en');
    }
  });

  it('saves content updates with only { content } and template updates with only { templateKey }', async () => {
    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const nextContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Updated Name' },
    };

    await act(async () => {
      result.current.updateContent(nextContent);
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => expect(updateCv).toHaveBeenCalled());
    expect(updateCv).toHaveBeenCalledWith('42', { content: nextContent });
    const contentCall = updateCv.mock.calls.find((call) => call[1].content);
    expect(contentCall?.[1]).toEqual({ content: nextContent });
    expect(contentCall?.[1]).not.toHaveProperty('templateKey');

    updateCv.mockClear();

    await act(async () => {
      result.current.updateTemplate('structured-minimal');
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => expect(updateCv).toHaveBeenCalled());
    expect(updateCv).toHaveBeenCalledWith('42', { templateKey: 'structured-minimal' });
    const templateCall = updateCv.mock.calls.find((call) => call[1].templateKey);
    expect(templateCall?.[1]).toEqual({ templateKey: 'structured-minimal' });
    expect(templateCall?.[1]).not.toHaveProperty('content');
  });

  it('keeps loaded position details when a template update response omits associations', async () => {
    updateCv.mockResolvedValueOnce({
      cv: {
        id: baseCv.id,
        version: baseCv.version,
        status: baseCv.status,
        userId: baseCv.userId,
        templateKey: 'structured-minimal',
        content: baseCv.content,
      },
    });

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.updateTemplate('structured-minimal');
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => expect(updateCv).toHaveBeenCalled());
    expect(result.current.cv?.position.title).toBe('Frontend Engineer');
  });

  it('flushes a pending save before refresh and aborts refresh when that save fails', async () => {
    let rejectSave!: (error: Error) => void;
    updateCv.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        }),
    );

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const localContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Local Only' },
    };

    await act(async () => {
      result.current.updateContent(localContent);
    });

    let refreshPromise!: Promise<boolean>;
    await act(async () => {
      refreshPromise = result.current.refresh(['skills']);
    });

    expect(updateCv).toHaveBeenCalledWith('42', { content: localContent });
    expect(refreshCv).not.toHaveBeenCalled();

    await act(async () => {
      rejectSave(new Error('save failed'));
      await refreshPromise;
    });

    expect(refreshCv).not.toHaveBeenCalled();
    expect(result.current.content?.contact.name).toBe('Local Only');
    expect(result.current.saveError).toBeTruthy();
  });

  it('after a successful flush, refresh adopts the server response as sole local state', async () => {
    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const localContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Keep Local Contact' },
      skills: [{ label: 'Stale Skill' }],
    };

    await act(async () => {
      result.current.updateContent(localContent);
    });
    await act(async () => {
      await result.current.refresh(['skills']);
    });

    expect(updateCv).toHaveBeenCalledWith('42', { content: localContent });
    expect(refreshCv).toHaveBeenCalledWith('42', ['skills']);
    expect(result.current.content?.skills).toEqual([{ label: 'RefreshedSkill' }]);
    expect(result.current.content?.contact.name).toBe('Artem Ilyin');
  });

  it('surfaces load failures instead of leaving an indefinite loading skeleton', async () => {
    getCv.mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cv).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('does not mutate snapshot state for non-owners', async () => {
    getCv.mockResolvedValueOnce({
      cv: { ...structuredClone(baseCv), userId: 99 },
    });

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const originalName = result.current.content?.contact.name;

    await act(async () => {
      result.current.updateContent({
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'Hacker' },
      });
      result.current.updateTemplate('structured-minimal');
      await result.current.refresh(['contact']);
      await result.current.publish();
    });

    expect(updateCv).not.toHaveBeenCalled();
    expect(refreshCv).not.toHaveBeenCalled();
    expect(publishCv).not.toHaveBeenCalled();
    expect(result.current.content?.contact.name).toBe(originalName);
    expect(result.current.templateKey).toBe('editorial-sidebar');
  });

  it('ignores in-flight save completions after navigating to a different CV id', async () => {
    let resolveOldSave!: (value: { cv: typeof baseCv }) => void;
    const oldSavePromise = new Promise<{ cv: typeof baseCv }>((resolve) => {
      resolveOldSave = resolve;
    });

    const nextCv = {
      ...structuredClone(baseCv),
      id: 99,
      content: {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'New CV Owner' },
      },
    };

    getCv.mockImplementation(async (cvId: string) => {
      if (cvId === '99') return { cv: nextCv };
      return { cv: structuredClone(baseCv) };
    });

    updateCv.mockImplementationOnce(() => oldSavePromise);

    const { result, rerender } = renderHook(({ id }: { id: string }) => useCvWorkspace(id), {
      wrapper,
      initialProps: { id: '42' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const staleContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Stale From 42' },
    };

    await act(async () => {
      result.current.updateContent(staleContent);
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalled());

    await act(async () => {
      rerender({ id: '99' });
    });
    await waitFor(() => expect(result.current.content?.contact.name).toBe('New CV Owner'));

    await act(async () => {
      resolveOldSave({
        cv: {
          ...baseCv,
          content: staleContent,
        },
      });
      await oldSavePromise;
    });

    expect(result.current.cv?.id).toBe(99);
    expect(result.current.content?.contact.name).toBe('New CV Owner');
  });

  it('debounces idle content saves but flushes immediately before refresh', async () => {
    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const first: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'First' },
    };
    const second: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Second' },
    };

    await act(async () => {
      result.current.updateContent(first);
      result.current.updateContent(second);
    });

    expect(updateCv).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(499);
    });
    expect(updateCv).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalledTimes(1));
    expect(updateCv).toHaveBeenCalledWith('42', { content: second });

    updateCv.mockClear();
    const third: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Flush Me' },
    };

    await act(async () => {
      result.current.updateContent(third);
    });
    expect(updateCv).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refresh(['skills']);
    });

    expect(updateCv).toHaveBeenCalledWith('42', { content: third });
    expect(refreshCv).toHaveBeenCalledWith('42', ['skills']);
  });

  it('does not claim all changes saved until a successful mutation', async () => {
    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSaved).toBe(false);

    const nextContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Saved Name' },
    };

    await act(async () => {
      result.current.updateContent(nextContent);
    });
    expect(result.current.isSaved).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(result.current.isSaved).toBe(true));
    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('keeps action errors separate and retries the failed publish/refresh action', async () => {
    publishCv.mockRejectedValueOnce(new Error('publish failed'));

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.publish();
    });

    expect(result.current.saveError).toBeNull();
    expect(result.current.actionError).toBeTruthy();
    expect(result.current.error).toBeNull();

    publishCv.mockResolvedValueOnce({ message: 'CV published' });

    await act(async () => {
      await result.current.retryAction();
    });

    expect(publishCv).toHaveBeenCalledTimes(2);
    expect(result.current.actionError).toBeNull();
    expect(result.current.cv?.status).toBe('published');
  });

  it('retries a failed refresh action with the same sections', async () => {
    refreshCv.mockRejectedValueOnce(new Error('refresh failed'));

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh(['education', 'projects']);
    });

    expect(result.current.saveError).toBeNull();
    expect(result.current.actionError).toBeTruthy();

    refreshCv.mockResolvedValueOnce({
      cv: {
        ...baseCv,
        content: {
          ...cvContentFixture,
          education: [
            {
              ...cvContentFixture.education[0],
              institution: 'Retried University',
            },
          ],
        },
      },
      refreshedAt: '2026-07-24T13:00:00.000Z',
    });

    await act(async () => {
      await result.current.retryAction();
    });

    expect(refreshCv).toHaveBeenNthCalledWith(1, '42', ['education', 'projects']);
    expect(refreshCv).toHaveBeenNthCalledWith(2, '42', ['education', 'projects']);
    expect(result.current.content?.education[0]?.institution).toBe('Retried University');
    expect(result.current.actionError).toBeNull();
  });

  it('retries a pending action even when saveError also exists; retrySave only flushes save', async () => {
    publishCv.mockRejectedValueOnce(new Error('publish failed'));

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.publish();
    });
    expect(result.current.actionError).toBeTruthy();

    let rejectSave!: (error: Error) => void;
    updateCv.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        }),
    );

    const dirty: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Dirty After Publish Fail' },
    };

    await act(async () => {
      result.current.updateContent(dirty);
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalled());

    await act(async () => {
      rejectSave(new Error('save failed'));
    });
    await waitFor(() => expect(result.current.saveError).toBeTruthy());
    expect(result.current.actionError).toBeTruthy();

    publishCv.mockClear();
    publishCv.mockResolvedValueOnce({ message: 'CV published' });
    updateCv.mockImplementation(async (_id: string, patch: { content?: CvContent; templateKey?: string }) => ({
      cv: {
        ...baseCv,
        ...(patch.content ? { content: patch.content } : {}),
        ...(patch.templateKey ? { templateKey: patch.templateKey } : {}),
      },
    }));

    await act(async () => {
      await result.current.retryAction();
    });

    expect(publishCv).toHaveBeenCalledTimes(1);
    expect(result.current.actionError).toBeNull();
    expect(result.current.cv?.status).toBe('published');

    updateCv.mockClear();
    updateCv.mockRejectedValueOnce(new Error('save failed again'));

    const dirtier: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Needs Save Retry' },
    };

    await act(async () => {
      result.current.updateContent(dirtier);
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(result.current.saveError).toBeTruthy());

    updateCv.mockResolvedValueOnce({
      cv: { ...baseCv, content: dirtier },
    });

    await act(async () => {
      await result.current.retrySave();
    });

    expect(updateCv).toHaveBeenCalledWith('42', { content: dirtier });
    expect(publishCv).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.saveError).toBeNull());
  });

  it('invalidates in-flight saves on explicit same-id reload', async () => {
    let resolveContentSave!: (value: { cv: typeof baseCv }) => void;
    const contentSavePromise = new Promise<{ cv: typeof baseCv }>((resolve) => {
      resolveContentSave = resolve;
    });

    updateCv.mockImplementationOnce(() => contentSavePromise);

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const nextContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Stale Before Reload' },
    };

    await act(async () => {
      result.current.updateContent(nextContent);
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalledTimes(1));

    const reloadedCv = {
      ...structuredClone(baseCv),
      content: {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'Reloaded Owner' },
      },
    };
    getCv.mockResolvedValueOnce({ cv: reloadedCv });

    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.content?.contact.name).toBe('Reloaded Owner'));

    await act(async () => {
      resolveContentSave({
        cv: {
          ...baseCv,
          content: nextContent,
        },
      });
      await contentSavePromise;
    });

    expect(result.current.content?.contact.name).toBe('Reloaded Owner');
    expect(result.current.cv?.content?.contact.name).toBe('Reloaded Owner');
  });

  it('clears saving after same-id reload invalidates a stale in-flight save', async () => {
    let resolveContentSave!: (value: { cv: typeof baseCv }) => void;
    const contentSavePromise = new Promise<{ cv: typeof baseCv }>((resolve) => {
      resolveContentSave = resolve;
    });

    updateCv.mockImplementationOnce(() => contentSavePromise);

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const staleContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Stale Before Reload' },
    };

    await act(async () => {
      result.current.updateContent(staleContent);
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(result.current.saving).toBe(true));

    const reloadedCv = {
      ...structuredClone(baseCv),
      content: {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'Reloaded Owner' },
      },
    };
    getCv.mockResolvedValueOnce({ cv: reloadedCv });

    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.content?.contact.name).toBe('Reloaded Owner'));

    await act(async () => {
      resolveContentSave({
        cv: {
          ...baseCv,
          content: staleContent,
        },
      });
      await contentSavePromise;
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.content?.contact.name).toBe('Reloaded Owner');
    expect(result.current.cv?.content?.contact.name).toBe('Reloaded Owner');
  });

  it('does not apply a content+template batch to a newly navigated CV', async () => {
    let resolveOldContent!: (value: { cv: typeof baseCv }) => void;
    let resolveOldTemplate!: (value: { cv: typeof baseCv }) => void;

    const nextCv = {
      ...structuredClone(baseCv),
      id: 99,
      content: {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'New CV Owner' },
      },
    };

    getCv.mockImplementation(async (cvId: string) => {
      if (cvId === '99') return { cv: nextCv };
      return { cv: structuredClone(baseCv) };
    });

    updateCv
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldContent = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldTemplate = resolve;
          }),
      );

    const { result, rerender } = renderHook(({ id }: { id: string }) => useCvWorkspace(id), {
      wrapper,
      initialProps: { id: '42' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const batchContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Old Batch' },
    };

    await act(async () => {
      result.current.updateContent(batchContent);
      result.current.updateTemplate('structured-minimal');
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalledTimes(1));
    expect(updateCv).toHaveBeenCalledWith('42', { content: batchContent });

    // Finish the content leg while still on 42 so the template leg starts, then navigate.
    await act(async () => {
      resolveOldContent({
        cv: {
          ...baseCv,
          content: batchContent,
        },
      });
    });
    await waitFor(() => expect(updateCv).toHaveBeenCalledTimes(2));
    expect(updateCv).toHaveBeenNthCalledWith(2, '42', { templateKey: 'structured-minimal' });

    await act(async () => {
      rerender({ id: '99' });
    });
    await waitFor(() => expect(result.current.content?.contact.name).toBe('New CV Owner'));

    await act(async () => {
      resolveOldTemplate({
        cv: {
          ...baseCv,
          content: batchContent,
          templateKey: 'structured-minimal',
        },
      });
    });

    expect(result.current.cv?.id).toBe(99);
    expect(result.current.content?.contact.name).toBe('New CV Owner');
    expect(result.current.templateKey).toBe('editorial-sidebar');
    expect(result.current.cv?.templateKey).toBe('editorial-sidebar');
  });

  it('flushes a pending debounced edit for the previous CV before id change resets queues', async () => {
    const nextCv = {
      ...structuredClone(baseCv),
      id: 99,
      content: {
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'New CV Owner' },
      },
    };

    getCv.mockImplementation(async (cvId: string) => {
      if (cvId === '99') return { cv: nextCv };
      return { cv: structuredClone(baseCv) };
    });

    const { result, rerender } = renderHook(({ id }: { id: string }) => useCvWorkspace(id), {
      wrapper,
      initialProps: { id: '42' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const pendingContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Debounced On 42' },
    };

    await act(async () => {
      result.current.updateContent(pendingContent);
    });
    expect(updateCv).not.toHaveBeenCalled();

    await act(async () => {
      rerender({ id: '99' });
    });
    await waitFor(() => expect(result.current.content?.contact.name).toBe('New CV Owner'));

    expect(updateCv).toHaveBeenCalledWith('42', { content: pendingContent });
    expect(result.current.content?.contact.name).toBe('New CV Owner');
  });

  it('surfaces server validation messages in saveError with localized fallback', async () => {
    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    updateCv.mockRejectedValueOnce({
      response: { data: { message: 'Markdown must not contain HTML tags' } },
    });

    await act(async () => {
      result.current.updateContent({
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'Invalid Save' },
      });
      vi.advanceTimersByTime(500);
    });

    await waitFor(() =>
      expect(result.current.saveError).toBe('Markdown must not contain HTML tags'),
    );

    updateCv.mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      result.current.updateContent({
        ...cvContentFixture,
        contact: { ...cvContentFixture.contact, name: 'Network Fail' },
      });
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => expect(result.current.saveError).toBeTruthy());
    expect(result.current.saveError).not.toBe('Markdown must not contain HTML tags');
    expect(result.current.saveError).toMatch(/could not save|не удалось/i);
  });

  it('does not adopt stale server data while a same-id cleanup flush is in flight', async () => {
    const localContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Local Pending' },
    };
    const staleServerContent: CvContent = {
      ...cvContentFixture,
      contact: { ...cvContentFixture.contact, name: 'Stale Server' },
    };

    let resolveFlush!: (value: { cv: typeof baseCv }) => void;
    let flushCompleted = false;

    const { result } = renderHook(() => useCvWorkspace('42'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.updateContent(localContent);
    });
    expect(updateCv).not.toHaveBeenCalled();

    updateCv.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFlush = (value) => {
            flushCompleted = true;
            resolve(value);
          };
        }),
    );

    getCv.mockImplementation(async () => ({
      cv: {
        ...structuredClone(baseCv),
        content: flushCompleted ? localContent : staleServerContent,
      },
    }));

    await act(async () => {
      await i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en');
    });

    await waitFor(() => expect(updateCv).toHaveBeenCalledWith('42', { content: localContent }));

    await act(async () => {
      resolveFlush({
        cv: {
          ...baseCv,
          content: localContent,
        },
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.content?.contact.name).toBe('Local Pending');
    expect(result.current.content?.contact.name).not.toBe('Stale Server');
  });
});
