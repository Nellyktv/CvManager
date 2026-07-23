import { useEffect, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowId } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';

import UsersToolbar from './UsersToolbar';
import AssignRoleDialog from './AssignRoleDialog';
import { api } from '../../api/axios.api';
import useUserStore, { type UserRole } from '../../store/UserStore';
import {
  type ServerUser,
  type UserRow,
} from './AdminPage.constants';

const roles: UserRole[] = ['CANDIDATE', 'RECRUITER', 'ADMIN'];

const USERS_ROUTE = '/user';
const DEFAULT_ROLE: UserRole = 'CANDIDATE';

const AdminPage = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useUserStore((state) => state.user);

  const columns: GridColDef<UserRow>[] = [
    {
      field: 'name',
      headerName: t('users.columnName'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'email',
      headerName: t('users.columnEmail'),
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: t('users.columnRoles'),
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={t(`roles.${params.value.toLowerCase()}`)}
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: t('users.columnStatus'),
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={
            params.value === 'Blocked'
              ? t('users.statusBlocked')
              : params.value === 'Active'
                ? t('users.statusActive')
                : t('users.statusNotActivated')
          }
          color={
            params.value === 'Blocked'
              ? 'error'
              : params.value === 'Active'
                ? 'success'
                : 'warning'
          }
        />
      ),
    },
  ];

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(DEFAULT_ROLE);

  const selectedUsers = users.filter((user) =>
    selectedIds.includes(user.id)
  );

  let anyBlocked = false;
  let anyUnblocked = false;
  for (const user of selectedUsers) {
    if (user.isBlocked) {
      anyBlocked = true;
    } else {
      anyUnblocked = true;
    }
  }

  const showSuccess = (message: string) => {
    enqueueSnackbar(message, {
      variant: 'success',
    });
  };

  const showError = (error: unknown) => {
    console.error(error);

    enqueueSnackbar(t('common.error'), {
      variant: 'error',
    });
  };

  const loadUsers = async () => {
    try {
      const response = await api.get(USERS_ROUTE);

      const data = response.data.allUsers.map((user: ServerUser) => {
        return {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: user.role,
          status: user.isBlocked
            ? 'Blocked'
            : user.isActivated
              ? 'Active'
              : 'NotActivated',
          isBlocked: user.isBlocked,
        };
      });

      const dataWithoutSelf = data.filter(
        (user: UserRow) => user.id !== currentUser.id
      );

      setUsers(dataWithoutSelf);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async () => {
    let hasError = false;

    for (const id of selectedIds) {
      try {
        await api.delete(`${USERS_ROUTE}/${id}`);
      } catch (error) {
        showError(error);
        hasError = true;
      }
    }

    if (!hasError) {
      showSuccess(t('common.deleted'));
    }

    setSelectedIds([]);
    loadUsers();
  };

  const handleBlockUsers = async () => {
    let hasError = false;

    for (const id of selectedIds) {
      try {
        await api.put(`${USERS_ROUTE}/${id}`, {
          isBlocked: true,
        });
      } catch (error) {
        showError(error);
        hasError = true;
      }
    }

    if (!hasError) {
      showSuccess(t('common.saved'));
    }

    loadUsers();
  };

  const handleUnblockUsers = async () => {
    let hasError = false;

    for (const id of selectedIds) {
      try {
        await api.put(`${USERS_ROUTE}/${id}`, {
          isBlocked: false,
        });
      } catch (error) {
        showError(error);
        hasError = true;
      }
    }

    if (!hasError) {
      showSuccess(t('common.saved'));
    }

    loadUsers();
  };

  const openRoleDialog = () => {
    const user = users.find((user) => user.id === selectedIds[0]);

    if (!user) return;

    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleAssignRole = async () => {
    try {
      await api.put(`${USERS_ROUTE}/${selectedIds[0]}`, {
        role: newRole,
      });

      showSuccess(t('common.saved'));

      setRoleDialogOpen(false);
      setSelectedIds([]);

      loadUsers();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('users.title')}
      </Typography>

      <Paper sx={{ p: 2, m: 1, borderRadius: 3 }}>
        <UsersToolbar
          selectedCount={selectedIds.length}
          anyBlocked={anyBlocked}
          anyUnblocked={anyUnblocked}
          onDelete={handleDelete}
          onAssignRole={openRoleDialog}
          onBlock={handleBlockUsers}
          onUnblock={handleUnblockUsers}
        />

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            loading={isLoading}
            checkboxSelection
            disableRowSelectionOnClick
            disableRowSelectionExcludeModel
            rowSelectionModel={{ type: 'include', ids: new Set(selectedIds) }}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            onRowSelectionModelChange={(model) =>
              setSelectedIds(Array.from(model.ids))
            }
          />
        </Box>
      </Paper>

      <AssignRoleDialog
        open={roleDialogOpen}
        roles={roles}
        value={newRole}
        onChange={setNewRole}
        onClose={() => setRoleDialogOpen(false)}
        onSave={handleAssignRole}
      />
    </>
  );
};

export default AdminPage;