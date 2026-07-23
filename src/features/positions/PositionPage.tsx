import { Paper, Typography, Box, Button, Stack } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router';
import { useState } from 'react';

import CrudToolbar from '../../shared/components/toolbars/CrudToolbar';
import { api } from '../../api/axios.api';
import useUserStore from '../../store/UserStore';

import { useCrud } from '../../shared/hooks/useCrud';
import { useDialogForm } from '../../shared/hooks/useDialogForm';

import {
  POSITION_ROUTE,
  CANDIDAT_SKILLS_CONTAINER_ROUTER,
  USER_CANDIDATES_ROUTE,
} from '../../shared/utils/constsLinks';

import {
  type Position,
  type Attribute,
  type Candidate,
  type PositionCv,
  initialForm,
} from './PositionPage.constants';
import PositionFormDialog from './PositionFormDialog';
import PositionCvsDialog from './PositionCvsDialog';

const PositionPage = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const role = useUserStore((state) => state.user.role);
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: t('positions.columnTitle'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'description',
      headerName: t('positions.columnDescription'),
      flex: 2,
      minWidth: 220,
    },
    {
      field: 'visibility',
      headerName: t('positions.columnVisibility'),
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'updatedAt',
      headerName: t('positions.columnUpdated'),
      flex: 1,
      minWidth: 130,
    },
  ];

  const {
    items: positions,
    createItem,
    updateItem,
    deleteItems,
  } = useCrud<Position>(POSITION_ROUTE, 'allPositions');

  const { items: attributes } = useCrud<Attribute>(
    CANDIDAT_SKILLS_CONTAINER_ROUTER,
    'allAttributes',
    role === 'RECRUITER' || role === 'ADMIN'
  );

  const { items: candidates } = useCrud<Candidate>(
    USER_CANDIDATES_ROUTE,
    'allCandidates',
    role === 'RECRUITER' || role === 'ADMIN'
  );

  const {
    open,
    form,
    setForm,
    editId,
    openCreate,
    openEdit,
    closeDialog,
  } = useDialogForm(initialForm);

  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]);
  const [cvsDialogOpen, setCvsDialogOpen] = useState(false);
  const [positionCvs, setPositionCvs] = useState<PositionCv[]>([]);

  const formFields = [
    {
      label: t('positions.fieldTitle'),
      value: form.title,
      onChange: (value: string) => setForm({ ...form, title: value }),
    },
    {
      label: t('positions.fieldDescription'),
      value: form.description,
      onChange: (value: string) => setForm({ ...form, description: value }),
    },
    {
      label: t('positions.fieldVisibility'),
      value: form.visibility,
      onChange: (value: string) => setForm({ ...form, visibility: value }),
    },
  ];

  const handleSave = async () => {
    if (editId) {
      await updateItem(editId, form);
    } else {
      await createItem(form);
    }

    closeDialog();
    setSelectedIds([]);
  };

  const handleEdit = () => {
    const position = positions.find((el) => el.id === selectedIds[0]);

    if (!position) return;

    openEdit(position.id, {
      title: position.title,
      description: position.description,
      visibility: position.visibility,
      attributeIds: position.attributes ? position.attributes.map((el) => el.id) : [],
      allowedCandidateIds: position.allowedCandidates ? position.allowedCandidates.map((el) => el.id) : [],
    });
  };

  const handleDelete = async () => {
    await deleteItems(selectedIds.map(Number));
    setSelectedIds([]);
  };

  const handleDuplicate = async () => {
    const position = positions.find((el) => el.id === selectedIds[0]);

    if (!position) return;

    await createItem({
      title: `${position.title} (copy)`,
      description: position.description,
      visibility: position.visibility,
      attributeIds: position.attributes ? position.attributes.map((el) => el.id) : [],
      allowedCandidateIds: position.allowedCandidates ? position.allowedCandidates.map((el) => el.id) : [],
    });

    setSelectedIds([]);
  };

  const handleViewCvs = async () => {
    const position = positions.find((el) => el.id === selectedIds[0]);

    if (!position) return;

    try {
      const response = await api.get(`/cv/position/${position.id}`);
      setPositionCvs(response.data.cvsByPosition);
      setCvsDialogOpen(true);
    } catch (error) {
      console.error('Failed to load CVs', error);
    }
  };

  const handleGenerateCv = async () => {
    try {
      await api.post('/cv/create_resume', {
        positionId: selectedIds[0],
      });

      enqueueSnackbar(t('cv.generated'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to generate CV', error);
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  let visiblePositions = positions;
  if (tag) {
    visiblePositions = [];

    for (const position of positions) {
      const positionAttributes = position.attributes || [];

      let hasTag = false;
      for (const el of positionAttributes) {
        if (el.name === tag) {
          hasTag = true;
        }
      }

      if (hasTag) {
        visiblePositions.push(position);
      }
    }
  }

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('nav.positions')}
      </Typography>

      <Paper sx={{ p: 2, m: 1, borderRadius: 3 }}>
        {(role === 'RECRUITER' || role === 'ADMIN') && (
          <CrudToolbar
            selectedCount={selectedIds.length}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAdd={openCreate}
            addLabel={t('positions.addPosition')}
          >
            {role === 'ADMIN' && (
              <Button
                variant="outlined"
                disabled={selectedIds.length !== 1}
                onClick={handleGenerateCv}
              >
                {t('cv.generate')}
              </Button>
            )}

            <Button
              variant="outlined"
              disabled={selectedIds.length !== 1}
              onClick={handleDuplicate}
            >
              {t('common.duplicate')}
            </Button>

            <Button
              variant="outlined"
              disabled={selectedIds.length !== 1}
              onClick={handleViewCvs}
            >
              {t('positions.viewCvs')}
            </Button>
          </CrudToolbar>
        )}

        {role === 'CANDIDATE' && (
          <Stack direction="row" sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              disabled={selectedIds.length !== 1}
              onClick={handleGenerateCv}
            >
              {t('cv.generate')}
            </Button>
          </Stack>
        )}

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={visiblePositions}
            columns={columns}
            showToolbar
            disableColumnFilter
            checkboxSelection
            disableRowSelectionOnClick
            disableRowSelectionExcludeModel
            rowSelectionModel={{ type: 'include', ids: new Set(selectedIds) }}
            pageSizeOptions={[5, 10, 20]}
            onRowSelectionModelChange={(model) =>
              setSelectedIds(Array.from(model.ids))
            }
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

      <PositionFormDialog
        open={open}
        editId={editId}
        formFields={formFields}
        attributes={attributes}
        candidates={candidates}
        form={form}
        setForm={setForm}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <PositionCvsDialog
        open={cvsDialogOpen}
        cvs={positionCvs}
        onClose={() => setCvsDialogOpen(false)}
      />
    </>
  );
};

export default PositionPage;