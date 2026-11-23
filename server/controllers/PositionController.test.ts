import type { Request, Response } from 'express';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../dB.js', () => ({
    default: { transaction: vi.fn(async (callback: (transaction: object) => unknown) => callback({})) },
}));
vi.mock('../models/models.js', () => ({
    Position: { findByPk: vi.fn(), findAll: vi.fn(), create: vi.fn() },
    Attribute: {},
    User: {},
    Cv: {},
    CandidateSkills: {},
    setPositionAttributes: vi.fn(),
}));

const { Position } = await import('../models/models.js');
const { default: controller } = await import('./PositionController.js');

const createResponse = () => ({ json: vi.fn() }) as unknown as Response;

beforeEach(() => vi.clearAllMocks());

it('hides a restricted position from guests and candidates outside its access list', async () => {
    vi.mocked(Position.findByPk).mockResolvedValue({ allowedCandidates: [{ id: 8 }] } as never);
    const res = createResponse();

    for (const user of [undefined, { id: 5, role: 'CANDIDATE' }]) {
        const req = { params: { id: '1' }, user } as Request<{ id: string }>;
        await expect(controller.getPosition(req, res)).rejects.toMatchObject({ status: 404 });
    }
    expect(res.json).not.toHaveBeenCalled();
});

it('returns the restricted position to an allowed candidate without exposing other candidates', async () => {
    const allowedCandidates = [{ id: 8 }, { id: 12 }];
    vi.mocked(Position.findByPk).mockResolvedValue({
        allowedCandidates, toJSON: () => ({ id: 1, allowedCandidates }),
    } as never);
    const req = { params: { id: '1' }, user: { id: 8, role: 'CANDIDATE' } } as Request<{ id: string }>;
    const res = createResponse();

    await controller.getPosition(req, res);

    expect(res.json).toHaveBeenCalledWith({ position: { id: 1, allowedCandidates: undefined } });
});

it('prevents a different recruiter from changing or deleting a position', async () => {
    const position = { userId: 8, update: vi.fn(), destroy: vi.fn() };
    vi.mocked(Position.findByPk).mockResolvedValue(position as never);
    const req = {
        params: { id: '1' }, body: { title: 'Developer' }, user: { id: 5, role: 'RECRUITER' },
    } as Request<{ id: string }>;

    await expect(controller.updatePosition(req, createResponse())).rejects.toMatchObject({ status: 403 });
    await expect(controller.deletePosition(req, createResponse())).rejects.toMatchObject({ status: 403 });
    expect(position.update).not.toHaveBeenCalled();
    expect(position.destroy).not.toHaveBeenCalled();
});
