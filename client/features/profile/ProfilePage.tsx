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
import { useEffect, useState } from 'react';

import useUserStore from '../../store/UserStore';
import { useProfile } from './useProfile';
import { useCandidateProfile } from './hooks/useCandidateProfile';
import { useCrud } from '../../shared/hooks/useCrud';
import { useDialogForm } from '../../shared/hooks/useDialogForm';
import { PROJECT_ROUTE } from '../../shared/utils/constsLinks';
import {
  type Project,
  type ProjectFormValues,
  initialProjectForm,
} from './ProfilePage.constants';
import ProjectFormDialog from './ProjectFormDialog';
import CandidateContactForm from './components/CandidateContactForm';
import EducationSection from './components/EducationSection';
import CrudToolbar from '../../shared/components/toolbars/CrudToolbar';
import { SalesforceDialog } from './SalesforceDialog';

const toProjectPayload = (form: ProjectFormValues) => ({
  title: form.title.trim(),
  role: form.role || undefined,
  startDate: form.startDate || undefined,
  endDate: form.endDate || undefined,
  links: form.links.map((link) => ({
    label: link.label.trim() || link.url.trim(),
    url: link.url.trim(),
  })),
  descriptionMarkdown: form.descriptionMarkdown || undefined,
  displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
});

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
    profile: candidateProfile,
    loading: loadingContacts,
    saving: savingContacts,
    error: contactsError,
    saveProfile: saveCandidateProfile,
  } = useCandidateProfile(isCandidateProfile);

  const {
    items: projects,
    isLoading: loadingProjects,
    saving: savingProject,
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
    const payload = toProjectPayload(projectForm);

    const saved = projectEditId
      ? await updateProject(projectEditId, payload)
      : await createProject(payload);

    if (!saved) return;

    closeProjectDialog();
  };

  const [selectedProjectIds, setSelectedProjectIds] = useState<GridRowId[]>([]);
  const [selectedCvIds, setSelectedCvIds] = useState<GridRowId[]>([]);
  const [sfDialogOpen, setSfDialogOpen] = useState(false);
  const [sfSynced, setSfSynced] = useState(false);

  useEffect(() => {
    if (profile.salesforceContactId) {
      setSfSynced(true);
    }
  }, [profile.salesforceContactId]);

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
      field: 'role',
      headerName: t('profile.projectRole'),
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'descriptionMarkdown',
      headerName: t('profile.projectDescription'),
      flex: 2,
      minWidth: 220,
      valueGetter: (_, row) => row.descriptionMarkdown || row.description || '',
    },
  ];

  const handleEditProject = () => {
    const project = projects.find((el) => el.id === selectedProjectIds[0]);

    if (!project) return;

    openEditProject(project.id, {
      title: project.title,
      role: project.role || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      links: (project.links || []).map((link) => ({
        label: link.label || '',
        url: link.url || '',
      })),
      descriptionMarkdown:
        project.descriptionMarkdown || project.description || '',
      displayOrder:
        project.displayOrder === null || project.displayOrder === undefined
          ? ''
          : String(project.displayOrder),
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
            <Stack direction="row" gap={2}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('profile.saving') : t('profile.saveProfile')}
              </Button>
              {isOwner && (
                <Button
                  variant="outlined"
                  onClick={() => setSfDialogOpen(true)}
                >
                  {sfSynced ? t('profile.resyncSalesforce') : t('profile.addToSalesforce')}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {isCandidateProfile &&
        (loadingContacts ? (
          <Paper sx={{ p: 3, m: 1, borderRadius: 3, maxWidth: 640 }}>
            <Stack gap={2}>
              <Skeleton variant="text" width={180} height={32} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          </Paper>
        ) : (
          <CandidateContactForm
            initialProfile={candidateProfile}
            onSave={saveCandidateProfile}
            saving={savingContacts}
            errorMessage={contactsError}
          />
        ))}

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

      {isCandidateProfile && <EducationSection canEdit />}

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
              loading={loadingProjects}
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
        form={projectForm}
        onChange={setProjectForm}
        onClose={closeProjectDialog}
        onSave={handleSaveProject}
        saving={savingProject}
      />

      <SalesforceDialog
        open={sfDialogOpen}
        onClose={() => setSfDialogOpen(false)}
        onSuccess={() => setSfSynced(true)}
        defaultPhone={candidateProfile.phone}
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
