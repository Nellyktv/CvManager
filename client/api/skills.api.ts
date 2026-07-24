import { api } from './axios.api';

export type SkillRecord = {
  attributeId: number;
  value: string;
};

export const getSkills = async () => {
  const response = await api.get<{ skills: SkillRecord[] }>('/skills');
  return response.data;
};

export const saveSkill = async (data: { attributeId: number; value: string }) => {
  const response = await api.post<{ skill: SkillRecord }>('/skills', data);
  return response.data;
};

export const deleteSkill = async (attributeId: number) => {
  const response = await api.delete<{ message: string }>(`/skills/${attributeId}`);
  return response.data;
};
