import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';

import CrudToolbar from '../../shared/components/toolbars/CrudToolbar';
import { CANDIDAT_SKILLS_CONTAINER_ROUTER } from '../../shared/utils/constsLinks';
import { useCrud } from '../../shared/hooks/useCrud';
import { useDialogForm } from '../../shared/hooks/useDialogForm';
import {
  type Attribute,
  initialForm,
  typeOptions,
  categoryOptions,
} from './AttributesPage.constants';
import AttributeFormDialog from './AttributeFormDialog';

const AttributesPage = () => {
  const { t } = useTranslation();

  const columns: GridColDef<Attribute>[] = [
    {
      field: 'category',
      headerName: t('attributes.columnCategory'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => t(`attributes.category${params.value}`),
    },
    {
      field: 'name',
      headerName: t('attributes.columnName'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'type',
      headerName: t('attributes.columnType'),
      flex: 1,
      minWidth: 130,
      renderCell: (params) => t(`attributes.type${params.value}`),
    },
  ];

  const { items: attributes, isLoading, createItem, updateItem, deleteItems } =
    useCrud<Attribute>(CANDIDAT_SKILLS_CONTAINER_ROUTER, 'allAttributes');

  const { open, form, setForm, editId, openCreate, openEdit, closeDialog } =
    useDialogForm(initialForm);

  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]);

  const handleEdit = () => {
    const attr = attributes.find((el) => el.id === selectedIds[0]);
    if (!attr) return;
    openEdit(attr.id, {
      name: attr.name,
      description: attr.description,
      category: attr.category,
      type: attr.type,
    });
  };

  const handleSave = async () => {
    if (editId) {
      await updateItem(editId, form);
    } else {
      await createItem(form);
    }
    closeDialog();
    setSelectedIds([]);
  };

  const handleDelete = async () => {
    await deleteItems(selectedIds.map(Number));
    setSelectedIds([]);
  };

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('nav.attributeLibrary')}
      </Typography>

      <Paper sx={{ p: 2, m: 1, borderRadius: 3 }}>
        <CrudToolbar
          selectedCount={selectedIds.length}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAdd={openCreate}
          addLabel={t('attributes.addAttribute')}
        />

        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={attributes}
            columns={columns}
            loading={isLoading}
            showToolbar
            disableColumnFilter
            checkboxSelection
            disableRowSelectionOnClick
            disableRowSelectionExcludeModel
            rowSelectionModel={{ type: 'include', ids: new Set(selectedIds) }}
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
      </Paper>

      <AttributeFormDialog
        open={open}
        editId={editId}
        nameValue={form.name}
        onNameChange={(value) => setForm({ ...form, name: value })}
        descriptionValue={form.description}
        onDescriptionChange={(value) => setForm({ ...form, description: value })}
        typeValue={form.type}
        typeOptions={typeOptions}
        onTypeChange={(value) => setForm({ ...form, type: value })}
        categoryValue={form.category}
        categoryOptions={categoryOptions}
        onCategoryChange={(value) => setForm({ ...form, category: value })}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </>
  );
};

export default AttributesPage;
