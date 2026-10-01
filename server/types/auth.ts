export const USER_ROLES = ['CANDIDATE', 'RECRUITER', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
    id: number;
    email: string;
    role: UserRole;
}
