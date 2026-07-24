import type { AttributeType } from '../attributes/AttributesPage.constants';

export type CvPosition = {
  id: number;
  title: string;
};

export type CvUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type CvData = {
  id: number;
  version: number;
  status: string;
  userId: number;
  position: CvPosition;
  user: CvUser;
};

export type CvAttribute = {
  id: number;
  name: string;
  description: string;
  type: AttributeType;
  options: string | null;
  value: string | null;
};

export type CvProject = {
  id: number;
  title: string;
  description: string;
};
