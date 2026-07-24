import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';

import CrudToolbar from '../../../shared/components/toolbars/CrudToolbar';
import { useDialogForm } from '../../../shared/hooks/useDialogForm';
import { useEducation } from '../hooks/useEducation';
import {
  initialEducationForm,
  type EducationFormValues,
} from '../ProfilePage.constants';
import EducationFormDialog from './EducationFormDialog';

type Props = {
  canEdit: boolean;
};

const toPayload = (form: EducationFormValues) => ({
  institution: form.institution.trim(),
  degree: form.degree || undefined,
  field: form.field || undefined,
  location: form.location || undefined,
  startDate: form.startDate || undefined,
  endDate: form.endDate || undefined,
  description: form.description || undefined,
  displayOrder: form.displayOrder === '' ? undefined : Number(form.displayOrder),
});

const EducationSection = ({ canEdit }: Props) => {
  const { t } = useTranslation();
  const {
    educations,
    loading,
    saving,
    error,
    createItem,
    updateItem,
    deleteItems,
  } = useEducation(true);

  const {
    open,
    form,
    setForm,
    editId,
    openCreate,
    openEdit,
    closeDialog,
  } = useDialogForm(initialEducationForm);

  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]);

  const columns: GridColDef[] = [
    {
      field: 'institution',
      headerName: t('profile.institution'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'degree',
      headerName: t('profile.degree'),
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'field',
      headerName: t('profile.field'),
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'location',
      headerName: t('profile.educationLocation'),
      flex: 1,
      minWidth: 120,
    },
  ];

  const handleEdit = () => {
    const education = educations.find((el) => el.id === selectedIds[0]);
    if (!education) return;

    openEdit(education.id, {
      institution: education.institution || '',
      degree: education.degree || '',
      field: education.field || '',
      location: education.location || '',
      startDate: education.startDate || '',
      endDate: education.endDate || '',
      description: education.description || '',
      displayOrder:
        education.displayOrder === null || education.displayOrder === undefined
          ? ''
          : String(education.displayOrder),
    });
  };

  const handleSave = async () => {
    const payload = toPayload(form);

    const saved = editId
      ? await updateItem(editId, payload)
      : await createItem(payload);

    if (!saved) return;

    closeDialog();
    setSelectedIds([]);
  };

  const handleDelete = async () => {
    await deleteItems(selectedIds.map(Number));
    setSelectedIds([]);
  };

  return (
    <Paper sx={{ p: 3, m: 1, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('profile.educationTitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {educations.length === 0 && !loading ? (
        <Stack gap={2} alignItems="flex-start">
          <Typography variant="body2" color="text.secondary">
            {t('profile.noEducationYet')}
          </Typography>
          {canEdit && (
            <Button variant="contained" onClick={openCreate}>
              {t('profile.addEducation')}
            </Button>
          )}
        </Stack>
      ) : (
        <>
          {canEdit && (
            <CrudToolbar
              selectedCount={selectedIds.length}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onAdd={openCreate}
              addLabel={t('profile.addEducation')}
            />
          )}

          <Box sx={{ height: 320 }}>
            <DataGrid
              rows={educations}
              columns={columns}
              loading={loading}
              checkboxSelection={canEdit}
              disableRowSelectionOnClick
              disableRowSelectionExcludeModel
              rowSelectionModel={{
                type: 'include',
                ids: new Set(selectedIds),
              }}
              onRowSelectionModelChange={(model) =>
                setSelectedIds(Array.from(model.ids))
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
        </>
      )}

      {canEdit && (
        <EducationFormDialog
          open={open}
          editId={editId}
          form={form}
          onChange={setForm}
          onClose={closeDialog}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </Paper>
  );
};

export default EducationSection;
