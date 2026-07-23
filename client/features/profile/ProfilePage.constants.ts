import type { UserRole } from '../../store/UserStore';
import type { AttributeCategory, AttributeType } from '../attributes/AttributesPage.constants';

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole | '';
};

export type CvPosition = {
  id: number;
  title: string;
};

export type Cv = {
  id: number;
  version: number;
  status: string;
  position: CvPosition | null;
};

export type AttributeItem = {
  id: number;
  name: string;
  category: AttributeCategory;
  type: AttributeType;
};

export type Skill = {
  attributeId: number;
  value: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
};

export type ProjectFormValues = {
  title: string;
  description: string;
};

export const initialProjectForm: ProjectFormValues = {
  title: '',
  description: '',
};

export const emptyProfile: Profile = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
};
