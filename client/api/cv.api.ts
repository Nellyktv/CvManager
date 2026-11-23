import { api } from './axios.api';
import type { CvContent, CvSectionKey, CvTemplateKey } from '../shared/types/cv';

export type CvRecord = {
  id: number;
  version: number;
  status: string;
  userId: number;
  templateKey: CvTemplateKey;
  content: CvContent | null;
  lastSyncedFromProfileAt?: string | null;
  position: {
    id: number;
    title: string;
  };
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email?: string;
  };
};

export type CvUpdate = {
  content?: CvContent;
  templateKey?: CvTemplateKey;
};

export type CvSection = CvSectionKey;

export const getCv = async (id: string, signal?: AbortSignal) => {
  const response = await api.get<{ cv: CvRecord }>(`/cv/${id}`, { signal });
  return response.data;
};

export const updateCv = async (id: string, patch: CvUpdate) => {
  const response = await api.put<{ cv: CvRecord }>(`/cv/${id}`, patch);
  return response.data;
};

export const refreshCv = async (id: string, sections: CvSection[]) => {
  const response = await api.put<{ cv: CvRecord; refreshedAt: string }>(
    `/cv/${id}/refresh-from-profile`,
    { sections },
  );
  return response.data;
};

export const publishCv = async (id: string) => {
  const response = await api.put<{ message: string }>(`/cv/${id}/publish`);
  return response.data;
};
