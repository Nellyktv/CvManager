import { Box, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useCvList, type CvRow } from '../../shared/hooks/useCvList';

const CvListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cvs: rows } = useCvList();

  const columns: GridColDef<CvRow>[] = [
    { field: 'candidate', headerName: t('cv.columnCandidate'), flex: 1, minWidth: 160 },
    { field: 'position', headerName: t('cv.columnPosition'), flex: 1, minWidth: 160 },
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
