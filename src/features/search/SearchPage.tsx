import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { api } from '../../api/axios.api';
import type { CvRow } from '../../shared/hooks/useCvList';

type User = {
  firstName: string | null;
  lastName: string | null;
};

type Position = {
  title: string;
};

type ServerCv = {
  id: number;
  version: number;
  updatedAt: string;
  user: User | null;
  position: Position | null;
};

const SearchPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');

  const [rows, setRows] = useState<CvRow[]>([]);

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

  const loadCv = async () => {
    try {
      const response = await api.get('/cv', { params: { tag } });

      const serverCvs: ServerCv[] = response.data.allCv;

      const tableRows: CvRow[] = [];

      for (const cv of serverCvs) {
        const firstName = cv.user ? cv.user.firstName || '' : '';
        const lastName = cv.user ? cv.user.lastName || '' : '';

        tableRows.push({
          id: cv.id,
          candidate: `${firstName} ${lastName}`.trim(),
          position: cv.position ? cv.position.title : '',
          version: cv.version,
          updated: dayjs(cv.updatedAt).format('DD.MM.YYYY'),
        });
      }

      setRows(tableRows);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCv();
  }, [tag]);

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        showToolbar
        disableColumnFilter
        onRowClick={(params) => navigate(`/cv/${params.id}`)}
      />
    </Box>
  );
};

export default SearchPage;