import { z } from 'zod';
import { USER_ROLES } from '../types/auth.js';

export const entityId = z.number().int().positive().max(2_147_483_647);
export const routeId = z.string().regex(/^\d{1,10}$/).transform(Number).pipe(entityId);
const name = z.string().trim().min(1).max(255);
const httpUrl = z.url({ protocol: /^https?$/ }).max(2048);

export const googleBody = z.strictObject({ credential: z.string().min(1).max(8192) });
export const userUpdateBody = z.strictObject({
    firstName: name,
    lastName: name,
    role: z.enum(USER_ROLES),
    isBlocked: z.boolean(),
}).partial()
    .refine((data) => Object.keys(data).length > 0, 'No changes provided');

const attributeBody = z.strictObject({
    name,
    description: z.string().max(5000).nullish(),
    type: z.enum(['Boolean', 'Numeric', 'Text', 'Date', 'Dropdown']),
    options: z.string().max(255).nullish(),
});
export const createAttributeBody = attributeBody;
export const updateAttributeBody = attributeBody.partial();
export const saveSkillBody = z.strictObject({ attributeId: entityId, value: z.string().max(5000).nullish() });
export const createCvBody = z.strictObject({ positionId: entityId });
export const skillTagQuery = z.string().trim().min(1).max(255).optional();
export const supportTicketBody = z.strictObject({
    summary: z.string().trim().min(1).max(5000),
    priority: z.enum(['High', 'Average', 'Low']),
    position: z.string().trim().max(255).optional(),
    link: httpUrl,
});
export const salesforceSyncBody = z.strictObject({
    companyName: name,
    phone: z.string().trim().min(1).max(40),
    website: z.union([httpUrl, z.literal('')]).optional(),
    industry: z.string().trim().max(255).optional(),
    additionalInfo: z.string().trim().max(5000).optional(),
});

const associatedIds = z.array(entityId).max(500);
const positionBody = z.strictObject({
    title: name,
    description: z.string().max(10000).nullish(),
    attributeIds: associatedIds.optional(),
    allowedCandidateIds: associatedIds.optional(),
});
export const createPositionBody = positionBody;
export const updatePositionBody = positionBody.partial();
