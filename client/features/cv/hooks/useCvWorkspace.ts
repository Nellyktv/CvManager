import { useCallback, useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getCv,
  publishCv,
  refreshCv,
  updateCv,
  type CvRecord,
  type CvSection,
  type CvUpdate,
} from '../../../api/cv.api';
import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import useUserStore from '../../../store/UserStore';
import { DEFAULT_TEMPLATE_KEY, emptyCvContent } from '../CvPage.constants';

export const CV_SAVE_DEBOUNCE_MS = 500;

type PendingAction =
  | { type: 'refresh'; sections: CvSection[] }
  | { type: 'publish' };

const canMutateCv = (cv: CvRecord | null, userId: number, role: string) =>
  Boolean(cv && (cv.userId === userId || role === 'ADMIN'));

const apiErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback;
  const response = (err as { response?: { data?: { message?: unknown } } }).response;
  const message = response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const mergeCvRecord = (current: CvRecord | null, next: CvRecord) =>
  current
    ? {
        ...current,
        ...next,
        position: next.position ?? current.position,
        user: next.user ?? current.user,
      }
    : next;

export const useCvWorkspace = (id: string | undefined) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useUserStore((state) => state.user);

  const [cv, setCv] = useState<CvRecord | null>(null);
  const [content, setContent] = useState<CvContent | null>(null);
  const [templateKey, setTemplateKey] = useState<CvTemplateKey>(DEFAULT_TEMPLATE_KEY);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const contentRef = useRef<CvContent | null>(null);
  const templateKeyRef = useRef<CvTemplateKey>(DEFAULT_TEMPLATE_KEY);
  const pendingRef = useRef<CvUpdate | null>(null);
  const queueTailRef = useRef<Promise<void>>(Promise.resolve());
  const saveFailedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);
  const workspaceIdRef = useRef(id);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const cleanupFlushRef = useRef<Promise<unknown>>(Promise.resolve());
  const [observedId, setObservedId] = useState(id);

  // Reset workspace UI state when the route id changes (render-time, not in an effect).
  // Queue/flush refs stay untouched here so the previous effect cleanup can still flush.
  if (observedId !== id) {
    setObservedId(id);
    setCv(null);
    setContent(null);
    setTemplateKey(DEFAULT_TEMPLATE_KEY);
    setLoading(Boolean(id));
    setError(null);
    setSaveError(null);
    setActionError(null);
    setSaving(false);
    setIsSaved(false);
  }

  const bumpGeneration = useCallback(() => {
    generationRef.current += 1;
    return generationRef.current;
  }, []);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const resetQueueState = useCallback(() => {
    clearDebounce();
    pendingRef.current = null;
    saveFailedRef.current = false;
    queueTailRef.current = Promise.resolve();
    pendingActionRef.current = null;
  }, [clearDebounce]);

  const adoptCv = useCallback((next: CvRecord) => {
    const nextContent = next.content ?? emptyCvContent();
    const nextTemplate = next.templateKey ?? DEFAULT_TEMPLATE_KEY;
    setCv((current) => mergeCvRecord(current, next));
    setContent(nextContent);
    setTemplateKey(nextTemplate);
    contentRef.current = nextContent;
    templateKeyRef.current = nextTemplate;
  }, []);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(t('cv.loadError'));
      return;
    }

    const generation = bumpGeneration();
    resetQueueState();
    setLoading(true);
    setError(null);
    setSaveError(null);
    setActionError(null);
    setSaving(false);
    setIsSaved(false);

    try {
      await cleanupFlushRef.current.catch(() => undefined);
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
      const data = await getCv(id);
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
      adoptCv(data.cv);
      setSaveError(null);
      setActionError(null);
      setIsSaved(false);
    } catch {
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
      setCv(null);
      setContent(null);
      setError(t('cv.loadError'));
    } finally {
      if (generation === generationRef.current && workspaceIdRef.current === id) {
        setLoading(false);
      }
    }
  }, [adoptCv, bumpGeneration, id, resetQueueState, t]);

  useEffect(() => {
    const generation = bumpGeneration();
    workspaceIdRef.current = id;
    resetQueueState();
    contentRef.current = null;
    templateKeyRef.current = DEFAULT_TEMPLATE_KEY;

    if (!id) {
      return;
    }

    void (async () => {
      try {
        await cleanupFlushRef.current.catch(() => undefined);
        if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
        const data = await getCv(id);
        if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
        adoptCv(data.cv);
        setError(null);
        setSaveError(null);
        setActionError(null);
        setIsSaved(false);
      } catch {
        if (generation !== generationRef.current || workspaceIdRef.current !== id) return;
        setCv(null);
        setContent(null);
        setError(t('cv.loadError'));
      } finally {
        if (generation === generationRef.current && workspaceIdRef.current === id) {
          setLoading(false);
        }
      }
    })();

    return () => {
      const pendingPatch = pendingRef.current;
      const flushId = workspaceIdRef.current;
      clearDebounce();
      debounceTimerRef.current = null;
      if (flushId && pendingPatch) {
        pendingRef.current = null;
        cleanupFlushRef.current = updateCv(flushId, pendingPatch).catch(() => undefined);
      }
    };
  }, [id, adoptCv, bumpGeneration, clearDebounce, resetQueueState, t]);

  const processQueue = useCallback(() => {
    const queuedForId = workspaceIdRef.current;
    const generation = generationRef.current;

    const run = queueTailRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!queuedForId) return;
        if (generation !== generationRef.current || workspaceIdRef.current !== queuedForId) {
          return;
        }

        while (pendingRef.current) {
          if (generation !== generationRef.current || workspaceIdRef.current !== queuedForId) {
            return;
          }

          const batch = pendingRef.current;
          pendingRef.current = null;
          setSaving(true);
          setSaveError(null);

          try {
            if (batch.content !== undefined) {
              const response = await updateCv(queuedForId, { content: batch.content });
              if (generation !== generationRef.current || workspaceIdRef.current !== queuedForId) {
                return;
              }
              setCv((current) => mergeCvRecord(current, response.cv));
            }
            if (batch.templateKey !== undefined) {
              const response = await updateCv(queuedForId, { templateKey: batch.templateKey });
              if (generation !== generationRef.current || workspaceIdRef.current !== queuedForId) {
                return;
              }
              setCv((current) => mergeCvRecord(current, response.cv));
              setTemplateKey(response.cv.templateKey ?? batch.templateKey);
              templateKeyRef.current = response.cv.templateKey ?? batch.templateKey;
            }
            saveFailedRef.current = false;
            setIsSaved(true);
          } catch (err) {
            if (generation !== generationRef.current || workspaceIdRef.current !== queuedForId) {
              return;
            }
            saveFailedRef.current = true;
            setIsSaved(false);
            const newer = pendingRef.current as CvUpdate | null;
            pendingRef.current = {
              content: newer?.content ?? batch.content,
              templateKey: newer?.templateKey ?? batch.templateKey,
            };
            setSaveError(apiErrorMessage(err, t('cv.saveError')));
            throw new Error('save failed', { cause: err });
          } finally {
            if (generation === generationRef.current && workspaceIdRef.current === queuedForId) {
              setSaving(false);
            }
          }
        }
      });

    queueTailRef.current = run;
    void run.catch(() => undefined);
    return run;
  }, [t]);

  const enqueueSave = useCallback(
    (patch: CvUpdate) => {
      const previous = pendingRef.current;
      pendingRef.current = {
        content: patch.content ?? previous?.content,
        templateKey: patch.templateKey ?? previous?.templateKey,
      };
      setIsSaved(false);
      saveFailedRef.current = false;

      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void processQueue();
      }, CV_SAVE_DEBOUNCE_MS);
    },
    [clearDebounce, processQueue],
  );

  const flushPendingSave = useCallback(async () => {
    clearDebounce();
    if (pendingRef.current) {
      void processQueue();
    }
    await queueTailRef.current.catch(() => undefined);

    if (saveFailedRef.current || pendingRef.current) {
      setSaveError((prev) => prev?.trim() || t('cv.saveError'));
      return false;
    }

    return true;
  }, [clearDebounce, processQueue, t]);

  const updateContent = useCallback(
    (nextContent: CvContent) => {
      if (!canMutateCv(cv, currentUser.id, currentUser.role)) return;

      setContent(nextContent);
      contentRef.current = nextContent;
      enqueueSave({ content: nextContent });
    },
    [cv, currentUser.id, currentUser.role, enqueueSave],
  );

  const updateTemplate = useCallback(
    (nextTemplate: CvTemplateKey) => {
      if (!canMutateCv(cv, currentUser.id, currentUser.role)) return;

      setTemplateKey(nextTemplate);
      templateKeyRef.current = nextTemplate;
      enqueueSave({ templateKey: nextTemplate });
    },
    [cv, currentUser.id, currentUser.role, enqueueSave],
  );

  const refresh = useCallback(
    async (sections: CvSection[]) => {
      if (!id || !canMutateCv(cv, currentUser.id, currentUser.role)) return false;
      if (sections.length === 0) return false;

      const generation = generationRef.current;
      const flushed = await flushPendingSave();
      if (!flushed) return false;
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;

      try {
        setActionError(null);
        const response = await refreshCv(id, sections);
        if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;
        adoptCv(response.cv);
        pendingRef.current = null;
        saveFailedRef.current = false;
        pendingActionRef.current = null;
        setIsSaved(true);
        enqueueSnackbar(t('common.saved'), { variant: 'success' });
        return true;
      } catch {
        if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;
        pendingActionRef.current = { type: 'refresh', sections };
        setActionError(t('common.error'));
        enqueueSnackbar(t('common.error'), { variant: 'error' });
        return false;
      }
    },
    [
      adoptCv,
      cv,
      currentUser.id,
      currentUser.role,
      enqueueSnackbar,
      flushPendingSave,
      id,
      t,
    ],
  );

  const publish = useCallback(async () => {
    if (!id || !canMutateCv(cv, currentUser.id, currentUser.role)) return false;

    const generation = generationRef.current;
    const flushed = await flushPendingSave();
    if (!flushed) return false;
    if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;

    try {
      setActionError(null);
      await publishCv(id);
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;
      setCv((prev) => (prev ? { ...prev, status: 'published' } : prev));
      pendingActionRef.current = null;
      enqueueSnackbar(t('cv.publishSuccess'), { variant: 'success' });
      return true;
    } catch {
      if (generation !== generationRef.current || workspaceIdRef.current !== id) return false;
      pendingActionRef.current = { type: 'publish' };
      setActionError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return false;
    }
  }, [
    cv,
    currentUser.id,
    currentUser.role,
    enqueueSnackbar,
    flushPendingSave,
    id,
    t,
  ]);

  const retrySave = useCallback(async () => {
    await flushPendingSave();
  }, [flushPendingSave]);

  const retryAction = useCallback(async () => {
    const pendingAction = pendingActionRef.current;
    if (!pendingAction) return;

    if (pendingAction.type === 'refresh') {
      await refresh(pendingAction.sections);
      return;
    }

    await publish();
  }, [publish, refresh]);

  return {
    cv,
    content,
    templateKey,
    loading,
    error,
    saveError,
    actionError,
    saving,
    isSaved,
    canEdit: canMutateCv(cv, currentUser.id, currentUser.role),
    updateContent,
    updateTemplate,
    refresh,
    publish,
    reload: load,
    retrySave,
    retryAction,
  };
};
