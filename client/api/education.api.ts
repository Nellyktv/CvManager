import { api } from './axios.api';
import type { Education } from '../shared/types/candidateProfile';

export type EducationRecord = Education & {
  id: number;
};

export const getEducations = async () => {
  const response = await api.get<{ educations: EducationRecord[] }>('/education');
  return response.data;
};

export const createEducation = async (data: Education) => {
  const response = await api.post<{ education: EducationRecord }>('/education', data);
  return response.data;
};

export const updateEducation = async (id: number, data: Partial<Education>) => {
  const response = await api.put<{ education: EducationRecord }>(`/education/${id}`, data);
  return response.data;
};

export const deleteEducation = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/education/${id}`);
  return response.data;
};
