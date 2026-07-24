import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/axios.api';
import { toCvRow, type CvRow, type ServerCv } from '../../shared/hooks/useCvList';

const SearchPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');

  const [rows, setRows] = useState<CvRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns: GridColDef<CvRow>[] = [
    {
      field: 'candidate',
      headerName: t('cv.columnCandidate'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'position',
      headerName: t('cv.columnPosition'),
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'version',
      headerName: t('cv.columnVersion'),
      width: 120,
    },
    {
      field: 'updated',
      headerName: t('cv.columnUpdated'),
      flex: 1,
      minWidth: 130,
    },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadCv = async () => {
      try {
        const response = await api.get('/cv', { params: { tag } });
        const serverCvs: ServerCv[] = response.data.allCv;
        if (!cancelled) {
          setRows(serverCvs.map(toCvRow));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCv();

    return () => {
      cancelled = true;
    };
  }, [tag]);

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        showToolbar
        disableColumnFilter
        onRowClick={(params) => navigate(`/cv/${params.id}`)}
      />
    </Box>
  );
};

export default SearchPage;