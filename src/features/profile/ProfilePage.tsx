import {
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  Autocomplete,
  Box,
  Divider,
  Skeleton,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import useUserStore from '../../store/UserStore';
import { useProfile } from './useProfile';
import { useCrud } from '../../shared/hooks/useCrud';
import { useDialogForm } from '../../shared/hooks/useDialogForm';
import { PROJECT_ROUTE } from '../../shared/utils/constsLinks';
import { type Project, initialProjectForm } from './ProfilePage.constants';
import ProjectFormDialog from './ProjectFormDialog';
import CrudToolbar from '../../shared/components/toolbars/CrudToolbar';

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const currentUser = useUserStore((state) => state.user);

  const profileId = paramId ? Number(paramId) : currentUser.id;
  const isOwner = profileId === currentUser.id;
  const canEdit = isOwner || currentUser.role === 'ADMIN';
  const isCandidateProfile =
    isOwner && (currentUser.role === 'CANDIDATE' || currentUser.role === 'ADMIN');

  const {
    profile,
    setProfile,
    cvs,
    saving,
    attributes,
    allAttributes,
    selectAttributes,
    loadingSkills,
    deleteCv,
    handleSave,
  } = useProfile(profileId, isCandidateProfile);

  const {
    items: projects,
    createItem: createProject,
    updateItem: updateProject,
    deleteItems: deleteProjects,
  } = useCrud<Project>(PROJECT_ROUTE, 'projects', isCandidateProfile);

  const {
    open: projectDialogOpen,
    form: projectForm,
    setForm: setProjectForm,
    editId: projectEditId,
    openCreate: openCreateProject,
    openEdit: openEditProject,
    closeDialog: closeProjectDialog,
  } = useDialogForm(initialProjectForm);

  const handleSaveProject = async () => {
    if (projectEditId) {
      await updateProject(projectEditId, projectForm);
    } else {
      await createProject(projectForm);
    }

    closeProjectDialog();
  };

  const [selectedProjectIds, setSelectedProjectIds] = useState<GridRowId[]>([]);
  const [selectedCvIds, setSelectedCvIds] = useState<GridRowId[]>([]);

  const cvColumns: GridColDef[] = [
    {
      field: 'position',
      headerName: t('cv.columnPosition'),
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => (row.position ? row.position.title : ''),
    },
    {
      field: 'version',
      headerName: t('cv.columnVersion'),
      width: 120,
    },
    {
      field: 'status',
      headerName: t('cv.columnStatus'),
      width: 140,
      valueGetter: (_, row) =>
        row.status === 'published'
          ? t('cv.statusPublished')
          : t('cv.statusDraft'),
    },
  ];

  const handleDeleteCvs = async () => {
    for (const id of selectedCvIds) {
      await deleteCv(Number(id));
    }

    setSelectedCvIds([]);
  };

  const projectColumns: GridColDef[] = [
    {
      field: 'title',
      headerName: t('profile.projectTitle'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'description',
      headerName: t('profile.projectDescription'),
      flex: 2,
      minWidth: 220,
    },
  ];

  const handleEditProject = () => {
    const project = projects.find((el) => el.id === selectedProjectIds[0]);

    if (!project) return;

    openEditProject(project.id, {
      title: project.title,
      description: project.description,
    });
  };

  const handleDeleteProjects = async () => {
    await deleteProjects(selectedProjectIds.map(Number));
    setSelectedProjectIds([]);
  };

  const initials =
    `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase();

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {isOwner ? t('profile.myProfile') : t('profile.candidateProfile')}
      </Typography>

      <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 640 }}>
        <Stack gap={2}>
          <Stack direction="row" gap={2} alignItems="center">
            <Avatar sx={{ width: 72, height: 72 }}>{initials}</Avatar>
            <Stack>
              <Typography variant="h6">
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.role}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction="row" gap={2}>
            <TextField
              label={t('profile.firstName')}
              value={profile.firstName}
              onChange={(e) =>
                setProfile({ ...profile, firstName: e.target.value })
              }
              disabled={!canEdit}
              fullWidth
            />
            <TextField
              label={t('profile.lastName')}
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
              disabled={!canEdit}
              fullWidth
            />
          </Stack>

          {canEdit && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saving ? t('profile.saving') : t('profile.saveProfile')}
            </Button>
          )}
        </Stack>
      </Paper>

      {isCandidateProfile && (
        <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 640 }}>
          <Typography variant="h6" gutterBottom>
            {t('profile.attributesTitle')}
          </Typography>

          {loadingSkills ? (
            <Stack gap={2}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={allAttributes}
              getOptionLabel={(el) => el.name}
              value={attributes}
              onChange={(_, selected) =>
                selectAttributes(selected.map((el) => el.id))
              }
              renderInput={(params) => (
                <TextField {...params} label={t('profile.selectAttributes')} />
              )}
            />
          )}
        </Paper>
      )}

      {isCandidateProfile && (
        <Paper sx={{ p: 3, m: 1, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('profile.projectsTitle')}
          </Typography>

          <CrudToolbar
            selectedCount={selectedProjectIds.length}
            onDelete={handleDeleteProjects}
            onEdit={handleEditProject}
            onAdd={openCreateProject}
            addLabel={t('profile.addProject')}
          />

          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={projects}
              columns={projectColumns}
              checkboxSelection
              disableRowSelectionOnClick
              disableRowSelectionExcludeModel
              rowSelectionModel={{ type: 'include', ids: new Set(selectedProjectIds) }}
              onRowSelectionModelChange={(model) =>
                setSelectedProjectIds(Array.from(model.ids))
              }
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 5,
                  },
                },
              }}
            />
          </Box>
        </Paper>
      )}

      <ProjectFormDialog
        open={projectDialogOpen}
        editId={projectEditId}
        titleValue={projectForm.title}
        onTitleChange={(value) => setProjectForm({ ...projectForm, title: value })}
        descriptionValue={projectForm.description}
        onDescriptionChange={(value) => setProjectForm({ ...projectForm, description: value })}
        onClose={closeProjectDialog}
        onSave={handleSaveProject}
      />

      <Paper sx={{ p: 3, m: 1, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('profile.myCvs')}
        </Typography>

        {cvs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('profile.noCvsYet')}
          </Typography>
        ) : (
          <>
            <Button
              color="error"
              variant="outlined"
              disabled={selectedCvIds.length === 0}
              onClick={handleDeleteCvs}
              sx={{ mb: 2 }}
            >
              {t('common.delete')}
            </Button>

            <Box sx={{ height: 320 }}>
              <DataGrid
                rows={cvs}
                columns={cvColumns}
                checkboxSelection
                disableRowSelectionOnClick
                disableRowSelectionExcludeModel
                rowSelectionModel={{ type: 'include', ids: new Set(selectedCvIds) }}
                onRowSelectionModelChange={(model) =>
                  setSelectedCvIds(Array.from(model.ids))
                }
                onRowClick={(params) => navigate(`/cv/${params.id}`)}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                }}
              />
            </Box>
          </>
        )}
      </Paper>
    </>
  );
};

export default ProfilePage;
