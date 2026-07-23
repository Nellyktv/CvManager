import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/axios.api';
import {
  emptyProfile,
  type Profile,
  type Cv,
  type AttributeItem,
  type Skill,
} from './ProfilePage.constants';

type CvOwner = {
  id: number;
};

type CvWithUser = Cv & {
  user: CvOwner | null;
};

export const useProfile = (profileId: number, isOwner: boolean) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();

  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeItem[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(isOwner);
  const [saving, setSaving] = useState(false);

  const attributes = allAttributes.filter((el) =>
    selectedAttributeIds.includes(el.id)
  );

  const showError = (error: unknown) => {
    console.error(error);
    enqueueSnackbar(t('common.error'), {
      variant: 'error',
    });
  };

  useEffect(() => {
    if (!profileId) return;

    api
      .get(`/user/${profileId}`)
      .then((response) => {
        const user = response.data.user;

        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          role: user.role || '',
        });
      })
      .catch((error) => {
        showError(error);
      });
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;

    api
      .get('/cv')
      .then((response) => {
        const cvsForProfile: Cv[] = [];

        for (const el of response.data.allCv as CvWithUser[]) {
          if (el.user && el.user.id === profileId) {
            cvsForProfile.push(el);
          }
        }

        setCvs(cvsForProfile);
      })
      .catch((error) => {
        showError(error);
      });
  }, [profileId, location.key]);

  useEffect(() => {
    if (!isOwner) return;

    Promise.all([api.get('/attribute'), api.get('/skills')])
      .then(([attributesResponse, skillsResponse]) => {
        setAllAttributes(attributesResponse.data.allAttributes);

        const selectedIds: number[] = [];

        for (const skill of skillsResponse.data.skills as Skill[]) {
          selectedIds.push(skill.attributeId);
        }

        setSelectedAttributeIds(selectedIds);
      })
      .catch((error) => {
        showError(error);
      })
      .finally(() => {
        setLoadingSkills(false);
      });
  }, [isOwner]);

  const selectAttributes = async (newSelectedIds: number[]) => {
    const addedIds: number[] = [];

    for (const id of newSelectedIds) {
      if (!selectedAttributeIds.includes(id)) {
        addedIds.push(id);
      }
    }

    const removedIds: number[] = [];

    for (const id of selectedAttributeIds) {
      if (!newSelectedIds.includes(id)) {
        removedIds.push(id);
      }
    }

    setSelectedAttributeIds(newSelectedIds);

    for (const id of addedIds) {
      try {
        await api.post('/skills', { attributeId: id, value: '' });
      } catch (error) {
        console.error(error);
      }
    }

    for (const id of removedIds) {
      try {
        await api.delete(`/skills/${id}`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const deleteCv = async (cvId: number) => {
    try {
      await api.delete(`/cv/${cvId}`);
      setCvs(cvs.filter((el) => el.id !== cvId));
    } catch (error) {
      showError(error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await api.put(`/user/${profileId}`, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      enqueueSnackbar(t('common.saved'), {
        variant: 'success',
      });
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    setProfile,
    cvs,
    attributes,
    allAttributes,
    selectAttributes,
    loadingSkills,
    saving,
    deleteCv,
    handleSave,
  };
};