export type Attribute = { id: number; name: string };

export type AllowedCandidate = { id: number };

export type Candidate = { id: number; firstName: string | null; lastName: string | null };

export type CvUser = { id: number; firstName: string | null; lastName: string | null };

export type PositionCv = { id: number; version: number; user: CvUser | null };

export type Position = {
  id: number;
  title: string;
  description: string;
  visibility: string;
  updatedAt: string;
  attributes?: Attribute[];
  allowedCandidates?: AllowedCandidate[];
};

export type PositionFormValues = {
  title: string;
  description: string;
  visibility: string;
  attributeIds: number[];
  allowedCandidateIds: number[];
};

export const initialForm: PositionFormValues = {
  title: '',
  description: '',
  visibility: '',
  attributeIds: [],
  allowedCandidateIds: [],
};
