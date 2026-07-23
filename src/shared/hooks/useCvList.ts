import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import { api } from '../../api/axios.api';

export type CvRow = {
  id: number;
  candidate: string;
  position: string;
  version: number;
  updated: string;
};

type Position = {
  title: string;
};

type User = {
  firstName: string | null;
  lastName: string | null;
};

type ServerCv = {
  id: number;
  version: number;
  updatedAt: string;
  position: Position | null;
  user: User | null;
};

export const useCvList = () => {
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCvs = () =>
    api
      .get('/cv')
      .then((response) => {
        const data: CvRow[] = [];

        for (const el of response.data.allCv as ServerCv[]) {
          const firstName = el.user ? el.user.firstName || '' : '';
          const lastName = el.user ? el.user.lastName || '' : '';

          data.push({
            id: el.id,
            candidate: `${firstName} ${lastName}`.trim(),
            position: el.position ? el.position.title : '',
            version: el.version,
            updated: dayjs(el.updatedAt).format('DD.MM.YYYY'),
          });
        }

        setCvs(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err as Error);
      })
      .finally(() => setIsLoading(false));

  useEffect(() => {
    loadCvs();
  }, []);

  return { cvs, isLoading, error };
};
