import { useEffect, useState } from 'react';
import {
  Paper,
  Stack,
  Typography,
  TextField,
  Chip,
  Skeleton,
  Button,
} from '@mui/material';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';

import { api } from '../../api/axios.api';
import useUserStore from '../../store/UserStore';
import { type CvData, type CvAttribute, type CvProject } from './CvPage.constants';

const CvPage = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();
  const currentUser = useUserStore((state) => state.user);

  const [cv, setCv] = useState<CvData | null>(null);
  const [attributes, setAttributes] = useState<CvAttribute[]>([]);
  const [projects, setProjects] = useState<CvProject[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get(`/cv/${id}`)
      .then((response) => {
        setCv(response.data.cv);
        setAttributes(response.data.attributes);
        setProjects(response.data.projects);
      })
      .catch((error) => {
        console.error('Failed to load CV', error);
      });
  }, [id]);

  const canEdit =
    cv !== null &&
    (cv.userId === currentUser.id || currentUser.role === 'ADMIN');

  const changeValue = (attributeId: number, value: string) => {
    setAttributes(
      attributes.map((el) =>
        el.id === attributeId ? { ...el, value } : el
      )
    );
  };

  const saveValue = async (attributeId: number) => {
    const attr = attributes.find((el) => el.id === attributeId);
    try {
      await api.post('/skills', {
        attributeId,
        value: attr ? attr.value || '' : '',
      });
    } catch (error) {
      console.error('Failed to save value', error);
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }

    setEditingId(null);
  };

  if (!cv) {
    return (
      <Stack gap={2} sx={{ m: 1, maxWidth: 640 }}>
        <Skeleton variant="text" height={48} width="60%" />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    );
  }

  let allFilled = attributes.length > 0;
  for (const el of attributes) {
    if (!el.value) {
      allFilled = false;
    }
  }

  const handlePublish = async () => {
    try {
      await api.put(`/cv/${id}/publish`);
      setCv({ ...cv, status: 'published' });
      enqueueSnackbar(t('common.saved'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to publish CV', error);
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {cv.position.title}
      </Typography>

      <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 640 }}>
        <Stack gap={2}>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip size="small" label={`v${cv.version}`} />
            <Chip
              size="small"
              color={cv.status === 'published' ? 'success' : 'default'}
              label={
                cv.status === 'published'
                  ? t('cv.statusPublished')
                  : t('cv.statusDraft')
              }
            />
            <Typography variant="body2" color="text.secondary">
              {t('cv.author')}: {cv.user.firstName} {cv.user.lastName} ({cv.user.email})
            </Typography>
          </Stack>

          {attributes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('cv.noAttributes')}
            </Typography>
          ) : (
            <Stack direction="row" gap={1} flexWrap="wrap">
              {attributes.map((el) =>
                canEdit && editingId === el.id ? (
                  <TextField
                    key={el.id}
                    autoFocus
                    variant="standard"
                    label={el.name}
                    value={el.value || ''}
                    onChange={(e) => changeValue(el.id, e.target.value)}
                    onBlur={() => saveValue(el.id)}
                  />
                ) : (
                  <Chip
                    key={el.id}
                    label={el.value ? `${el.name}: ${el.value}` : el.name}
                    variant={el.value ? 'filled' : 'outlined'}
                    onClick={canEdit ? () => setEditingId(el.id) : undefined}
                  />
                )
              )}
            </Stack>
          )}

          {canEdit && cv.status === 'draft' && (
            <Stack gap={0.5} sx={{ alignItems: 'flex-start' }}>
              <Button
                variant="contained"
                disabled={!allFilled}
                onClick={handlePublish}
              >
                {t('cv.publish')}
              </Button>

              {!allFilled && (
                <Typography variant="caption" color="text.secondary">
                  {t('cv.publishHint')}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 640 }}>
        <Typography variant="h6" gutterBottom>
          {t('profile.projectsTitle')}
        </Typography>

        {projects.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('profile.noProjectsYet')}
          </Typography>
        ) : (
          <Stack gap={2}>
            {projects.map((el) => (
              <Stack key={el.id} gap={0.5}>
                <Typography variant="subtitle2">{el.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {el.description}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </>
  );
};

export default CvPage;
