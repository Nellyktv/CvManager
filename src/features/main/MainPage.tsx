import { useEffect, useState } from 'react';
import { Stack, Typography, Skeleton } from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

import { api } from '../../api/axios.api';
import useUserStore from '../../store/UserStore';
import { POSITION_ROUTE, SEARCH_ROUTE } from '../../shared/utils/constsLinks';
import { type Tag, type PositionRow } from './MainPage.constants';
import DashboardStats from './DashboardStats';
import TagCloud from './TagCloud';
import PositionsTable from './PositionsTable';

type ServerPosition = {
  id: number;
  title: string;
  cvCount: number;
  updatedAt: string;
};

const MainPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useUserStore((state) => state.user.role);

  const [loading, setLoading] = useState(true);

  const [statsData, setStatsData] = useState({
    positionsCount: 0,
    cvsCount: 0,
    candidatesCount: 0,
    recruitersCount: 0,
  });

  const [latestPositions, setLatestPositions] = useState<PositionRow[]>([]);
  const [popularPositions, setPopularPositions] = useState<PositionRow[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const columnsLatest: GridColDef[] = [
    { field: 'title', headerName: t('dashboard.columnTitle'), flex: 1, minWidth: 180 },
    { field: 'cvs', headerName: t('dashboard.columnCvs'), type: 'number', flex: 1, minWidth: 90 },
    { field: 'updated', headerName: t('dashboard.columnUpdated'), flex: 1, minWidth: 130 },
  ];

  const columnsPopular: GridColDef[] = [
    { field: 'title', headerName: t('dashboard.columnTitle'), flex: 1, minWidth: 180 },
    { field: 'cvs', headerName: t('dashboard.columnCvs'), type: 'number', flex: 1, minWidth: 90 },
  ];

  const stats = [
    {
      value: statsData.positionsCount,
      label: t('dashboard.totalPositions'),
    },
    {
      value: statsData.cvsCount,
      label: t('dashboard.totalCvs'),
    },
    {
      value: statsData.candidatesCount,
      label: t('dashboard.candidates'),
    },
    {
      value: statsData.recruitersCount,
      label: t('dashboard.recruiters'),
    },
  ];

  const loadDashboard = () =>
    api
      .get('/position/dashboard')
      .then((response) => {
        const data = response.data;

        setStatsData(data.stats);

        const newLatestPositions = data.latestPositions.map((item: ServerPosition) => {
          return {
            id: item.id,
            title: item.title,
            cvs: item.cvCount,
            updated: dayjs(item.updatedAt).format('DD.MM.YYYY'),
          };
        });
        setLatestPositions(newLatestPositions);

        const newPopularPositions = data.popularPositions.map((item: ServerPosition) => {
          return {
            id: item.id,
            title: item.title,
            cvs: item.cvCount,
          };
        });
        setPopularPositions(newPopularPositions);

        setTags(data.tags);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTagClick = (name: string) => {
    if (role === 'CANDIDATE') {
      navigate(`${POSITION_ROUTE}?tag=${name}`);
    } else {
      navigate(`${SEARCH_ROUTE}?tag=${name}`);
    }
  };

  if (loading) {
    return (
      <Stack gap={2} sx={{ m: 1 }}>
        <Skeleton variant="text" height={48} width="30%" />

        <Stack direction="row" gap={2} flexWrap="wrap">
          <Skeleton variant="rounded" width={200} height={100} />
          <Skeleton variant="rounded" width={200} height={100} />
          <Skeleton variant="rounded" width={200} height={100} />
          <Skeleton variant="rounded" width={200} height={100} />
        </Stack>

        <Skeleton variant="rounded" height={150} />

        <Stack direction="row" gap={2} flexWrap="wrap">
          <Skeleton
            variant="rounded"
            height={400}
            sx={{ flexGrow: 1, minWidth: 320 }}
          />
          <Skeleton
            variant="rounded"
            height={400}
            sx={{ flexGrow: 1, minWidth: 320 }}
          />
        </Stack>
      </Stack>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ m: 1 }}>
        {t('nav.dashboard')}
      </Typography>

      <DashboardStats stats={stats} />

      <TagCloud tags={tags} onTagClick={handleTagClick} />

      <Stack direction="row" gap={2} sx={{ m: 1 }} flexWrap="wrap">
        <PositionsTable
          title={t('dashboard.latestPositions')}
          rows={latestPositions}
          columns={columnsLatest}
        />

        <PositionsTable
          title={t('dashboard.popularPositions')}
          rows={popularPositions}
          columns={columnsPopular}
        />
      </Stack>
    </>
  );
};

export default MainPage;