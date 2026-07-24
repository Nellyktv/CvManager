import { Box, Chip, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useCvList, type CvRow } from '../../shared/hooks/useCvList';
import { templateLabelKey } from './CvPage.constants';

const CvListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cvs: rows, isLoading } = useCvList();

  const columns: GridColDef<CvRow>[] = [
    { field: 'candidate', headerName: t('cv.columnCandidate'), flex: 1, minWidth: 160 },
    { field: 'position', headerName: t('cv.columnPosition'), flex: 1, minWidth: 160 },
    {
      field: 'status',
      headerName: t('cv.columnStatus'),
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          color={params.value === 'published' ? 'success' : 'default'}
          label={
            params.value === 'published' ? t('cv.statusPublished') : t('cv.statusDraft')
          }
          variant="outlined"
        />
      ),
    },
    {
      field: 'templateKey',
      headerName: t('cv.columnTemplate'),
      flex: 1,
      minWidth: 170,
      renderCell: (params) => (
        <Chip
          size="small"
          label={t(templateLabelKey(String(params.value)))}
          variant="outlined"
        />
      ),
    },
    { field: 'version', headerName: t('cv.columnVersion'), width: 120 },
    { field: 'updated', headerName: t('cv.columnUpdated'), flex: 1, minWidth: 130 },
  ];

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('nav.cvs')}
      </Typography>

      <Paper sx={{ p: 2, m: 1, borderRadius: 3 }}>
        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            showToolbar
            disableColumnFilter
            onRowClick={(params) => navigate(`/cv/${params.id}`)}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5 },
              },
            }}
          />
        </Box>
      </Paper>
    </>
  );
};

export default CvListPage;
