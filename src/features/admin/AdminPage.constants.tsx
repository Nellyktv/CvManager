import type { UserRole } from '../../store/UserStore';

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  isBlocked: boolean;
};

export type ServerUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UserRole;
  isActivated: boolean;
  isBlocked: boolean;
};
