import { expect, it } from 'vitest';
import { createPositionBody, googleBody, routeId, saveSkillBody, supportTicketBody, userUpdateBody } from './requestSchemas.js';

it('accepts a Google credential string and rejects legacy password payloads', () => {
    expect(googleBody.safeParse({ credential: 'google-credential' }).success).toBe(true);
    expect(googleBody.safeParse({ credential: ['google-credential'] }).success).toBe(false);
    expect(googleBody.safeParse({ email: 'candidate@example.com', password: 'ValidPass1' }).success).toBe(false);
    expect(userUpdateBody.safeParse({ password: 'NewPassword1' }).success).toBe(false);
});

it('keeps user identity and ownership fields outside writable payloads', () => {
    expect(userUpdateBody.safeParse({ firstName: 'Anna', isActivated: true }).success).toBe(false);
    expect(userUpdateBody.safeParse({ isBlocked: 'false' }).success).toBe(false);
    expect(createPositionBody.safeParse({ title: 'Engineer', userIdCreator: 12 }).success).toBe(false);
});

it('validates identifiers as bounded positive integers', () => {
    expect(routeId.parse('42')).toBe(42);
    for (const id of ['4.2', '0', '2147483648', '1e1']) {
        expect(routeId.safeParse(id).success).toBe(false);
    }
    expect(saveSkillBody.safeParse({ attributeId: ['4'], value: 'Advanced' }).success).toBe(false);
});

it('validates support ticket links and rejects delivery fields supplied by the client', () => {
    const ticket = { summary: 'Profile question', priority: 'Low', link: 'https://example.com/profile' };
    expect(supportTicketBody.safeParse(ticket).success).toBe(true);
    expect(supportTicketBody.safeParse({ ...ticket, link: 'ftp://example.com/profile' }).success).toBe(false);
    expect(supportTicketBody.safeParse({ ...ticket, adminEmails: ['external@example.com'] }).success).toBe(false);
});
