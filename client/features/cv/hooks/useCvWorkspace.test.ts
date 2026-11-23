import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { getCv, type CvRecord } from '../../../api/cv.api';
import { useCvWorkspace } from './useCvWorkspace';

vi.mock('../../../api/cv.api', () => ({ getCv: vi.fn() }));
vi.mock('../../../store/UserStore', () => ({
  default: () => ({ id: 1, role: 'CANDIDATE' }),
}));
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const record = (id: number): CvRecord => ({
  id,
  version: 1,
  status: 'draft',
  userId: 1,
  templateKey: 'editorial-sidebar',
  content: null,
  position: { id, title: 'Developer' },
  user: { id: 1, firstName: 'Ivan', lastName: 'Ivanov' },
});

const deferredCv = () => {
  let resolve!: (value: { cv: CvRecord }) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<{ cv: CvRecord }>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('keeps the current CV when a previous request resolves late', async () => {
  const previous = deferredCv();
  vi.mocked(getCv).mockReturnValueOnce(previous.promise).mockResolvedValueOnce({ cv: record(2) });

  const { result, rerender } = renderHook(({ id }) => useCvWorkspace(id), { initialProps: { id: '1' } });
  rerender({ id: '2' });
  await waitFor(() => expect(result.current.cv?.id).toBe(2));

  await act(async () => previous.resolve({ cv: record(1) }));
  expect(result.current.cv?.id).toBe(2);
  expect(result.current.loading).toBe(false);
});

it('keeps loading the current CV when the previous request fails', async () => {
  const previous = deferredCv();
  const current = deferredCv();
  vi.mocked(getCv).mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise);

  const { result, rerender } = renderHook(({ id }) => useCvWorkspace(id), { initialProps: { id: '1' } });
  rerender({ id: '2' });

  await act(async () => previous.reject(new Error('Previous request failed')));
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBeNull();

  await act(async () => current.resolve({ cv: record(2) }));
  expect(result.current.cv?.id).toBe(2);
  expect(result.current.loading).toBe(false);
});
