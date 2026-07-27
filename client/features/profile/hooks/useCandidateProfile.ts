import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import {
  getCandidateProfile,
  updateCandidateProfile,
  type CandidateProfileRecord,
} from '../../../api/candidateProfile.api';
import type { CandidateProfile } from '../../../shared/types/candidateProfile';

const emptyCandidateProfile: CandidateProfile = {
  headline: '',
  publicEmail: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
};

export const useCandidateProfile = (enabled: boolean) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [profile, setProfile] = useState<CandidateProfileRecord>(emptyCandidateProfile);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    setLoading(enabled);
  }

  useEffect(() => {
    if (!enabled) return;

    getCandidateProfile()
      .then((data) => {
        setProfile({
          ...emptyCandidateProfile,
          ...data.profile,
          headline: data.profile.headline || '',
          publicEmail: data.profile.publicEmail || '',
          phone: data.profile.phone || '',
          location: data.profile.location || '',
          linkedinUrl: data.profile.linkedinUrl || '',
          githubUrl: data.profile.githubUrl || '',
          portfolioUrl: data.profile.portfolioUrl || '',
        });
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
  }, [enabled, enqueueSnackbar, t]);

  const saveProfile = async (data: CandidateProfile) => {
    try {
      setSaving(true);
      setError(null);
      const response = await updateCandidateProfile(data);
      setProfile({
        ...emptyCandidateProfile,
        ...response.profile,
        headline: response.profile.headline || '',
        publicEmail: response.profile.publicEmail || '',
        phone: response.profile.phone || '',
        location: response.profile.location || '',
        linkedinUrl: response.profile.linkedinUrl || '',
        githubUrl: response.profile.githubUrl || '',
        portfolioUrl: response.profile.portfolioUrl || '',
      });
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    saveProfile,
  };
};
