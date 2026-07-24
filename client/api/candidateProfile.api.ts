import { api } from './axios.api';
import type { CandidateProfile } from '../shared/types/candidateProfile';

export type CandidateProfileRecord = CandidateProfile & {
  id?: number;
  userId?: number;
};

export const getCandidateProfile = async () => {
  const response = await api.get<{ profile: CandidateProfileRecord }>('/profile');
  return response.data;
};

export const updateCandidateProfile = async (data: CandidateProfile) => {
  const response = await api.put<{ profile: CandidateProfileRecord }>('/profile', data);
  return response.data;
};
