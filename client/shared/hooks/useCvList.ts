import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import { api } from '../../api/axios.api';
import type { CvTemplateKey } from '../types/cv';

export type CvRow = {
  id: number;
  candidate: string;
  position: string;
  version: number;
  updated: string;
  status: 'draft' | 'published' | string;
  templateKey: CvTemplateKey | string;
};

type Position = {
  title: string;
};

type User = {
  firstName: string | null;
  lastName: string | null;
};

export type ServerCv = {
  id: number;
  version: number;
  updatedAt: string;
  status?: string | null;
  templateKey?: string | null;
  position: Position | null;
  user: User | null;
};

/** Safe list-row mapping shared by CV list and search. Missing status → draft. */
export const toCvRow = (el: ServerCv): CvRow => {
  const firstName = el.user ? el.user.firstName || '' : '';
  const lastName = el.user ? el.user.lastName || '' : '';

  return {
    id: el.id,
    candidate: `${firstName} ${lastName}`.trim(),
    position: el.position ? el.position.title : '',
    version: el.version,
    updated: dayjs(el.updatedAt).format('DD.MM.YYYY'),
    status: el.status || 'draft',
    templateKey: el.templateKey || 'editorial-sidebar',
  };
};

export const useCvList = () => {
  const [cvs, setCvs] = useState<CvRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCvs = () =>
    api
      .get('/cv')
      .then((response) => {
        const data = (response.data.allCv as ServerCv[]).map(toCvRow);
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
