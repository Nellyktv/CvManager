import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  createEducation,
  deleteEducation,
  getEducations,
  updateEducation,
  type EducationRecord,
} from '../../../api/education.api';
import type { Education } from '../../../shared/types/candidateProfile';

export const useEducation = (enabled: boolean) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [educations, setEducations] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEducations = useCallback(() => {
    getEducations()
      .then((data) => {
        setEducations(data.educations);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(t('common.error'));
        enqueueSnackbar(t('common.error'), { variant: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [enqueueSnackbar, t]);

  useEffect(() => {
    if (!enabled) return;

    fetchEducations();
  }, [enabled, fetchEducations]);

  const createItem = async (data: Education) => {
    try {
      setSaving(true);
      setError(null);
      await createEducation(data);
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
      fetchEducations();
      return true;
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: number, data: Partial<Education>) => {
    try {
      setSaving(true);
      setError(null);
      await updateEducation(id, data);
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
      fetchEducations();
      return true;
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteItems = async (ids: number[]) => {
    let hasError = false;

    try {
      setSaving(true);
      for (const id of ids) {
        try {
          await deleteEducation(id);
        } catch (err) {
          console.error(err);
          hasError = true;
        }
      }

      if (hasError) {
        setError(t('common.error'));
        enqueueSnackbar(t('common.error'), { variant: 'error' });
      } else {
        setError(null);
        enqueueSnackbar(t('common.deleted'), { variant: 'success' });
      }

      fetchEducations();
    } finally {
      setSaving(false);
    }
  };

  return {
    educations,
    loading,
    saving,
    error,
    createItem,
    updateItem,
    deleteItems,
  };
};
