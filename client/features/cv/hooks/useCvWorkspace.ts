import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getCv,
  publishCv,
  refreshCv,
  updateCv,
  type CvRecord,
  type CvSection,
} from '../../../api/cv.api';
import type { CvContent, CvTemplateKey } from '../../../shared/types/cv';
import useUserStore from '../../../store/UserStore';
import { DEFAULT_TEMPLATE_KEY, emptyCvContent } from '../CvPage.constants';

export const CV_SAVE_DEBOUNCE_MS = 500;

const canMutateCv = (cv: CvRecord | null, userId: number, role: string) =>
  Boolean(cv && (cv.userId === userId || role === 'ADMIN'));

const apiErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback;
  const response = (err as { response?: { data?: { message?: unknown } } }).response;
  const message = response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

export const useCvWorkspace = (id: string | undefined) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useUserStore((state) => state.user);

  const [cv, setCv] = useState<CvRecord | null>(null);
  const [content, setContent] = useState<CvContent | null>(null);
  const [templateKey, setTemplateKey] = useState<CvTemplateKey>(DEFAULT_TEMPLATE_KEY);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : t('cv.loadError'));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [observedId, setObservedId] = useState(id);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the workspace to a loading state as soon as the CV id changes.
  // Done here (during render), not in an effect, because the effect below
  // only ever calls setState from inside a promise callback.
  if (observedId !== id) {
    setObservedId(id);
    setCv(null);
    setContent(null);
    setTemplateKey(DEFAULT_TEMPLATE_KEY);
    setLoading(Boolean(id));
    setError(id ? null : t('cv.loadError'));
    setSaveError(null);
    setActionError(null);
  }

  const load = () => {
    if (!id) return;

    getCv(id)
      .then((data) => {
        setCv(data.cv);
        setContent(data.cv.content ?? emptyCvContent());
        setTemplateKey(data.cv.templateKey ?? DEFAULT_TEMPLATE_KEY);
        setError(null);
        setIsSaved(false);
      })
      .catch(() => {
        setCv(null);
        setContent(null);
        setError(t('cv.loadError'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = (patch: { content?: CvContent; templateKey?: CvTemplateKey }) => {
    if (!id) return;

    setSaving(true);
    setSaveError(null);

    updateCv(id, patch)
      .then((response) => {
        setCv((current) => (current ? { ...current, ...response.cv } : response.cv));
        setIsSaved(true);
      })
      .catch((err) => {
        setIsSaved(false);
        setSaveError(apiErrorMessage(err, t('cv.saveError')));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const updateContent = (nextContent: CvContent) => {
    if (!canMutateCv(cv, currentUser.id, currentUser.role)) return;

    setContent(nextContent);
    setIsSaved(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save({ content: nextContent });
    }, CV_SAVE_DEBOUNCE_MS);
  };

  const updateTemplate = (nextTemplate: CvTemplateKey) => {
    if (!canMutateCv(cv, currentUser.id, currentUser.role)) return;

    setTemplateKey(nextTemplate);
    save({ templateKey: nextTemplate });
  };

  const refresh = async (sections: CvSection[]) => {
    if (!id || !canMutateCv(cv, currentUser.id, currentUser.role)) return false;
    if (sections.length === 0) return false;

    try {
      setActionError(null);
      const response = await refreshCv(id, sections);
      setCv(response.cv);
      setContent(response.cv.content ?? emptyCvContent());
      setTemplateKey(response.cv.templateKey ?? DEFAULT_TEMPLATE_KEY);
      setIsSaved(true);
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
      return true;
    } catch {
      setActionError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return false;
    }
  };

  const publish = async () => {
    if (!id || !canMutateCv(cv, currentUser.id, currentUser.role)) return false;

    try {
      setActionError(null);
      await publishCv(id);
      setCv((current) => (current ? { ...current, status: 'published' } : current));
      enqueueSnackbar(t('cv.publishSuccess'), { variant: 'success' });
      return true;
    } catch {
      setActionError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return false;
    }
  };

  const retrySave = () => {
    if (content) save({ content });
  };

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
  };
};
