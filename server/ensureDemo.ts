import { candidates, positions } from './demoFixtures.js';
import 'dotenv/config';
import sequelize from './dB.js';
import {
    User,
    Position,
    Attribute,
    CandidateSkills,
    Cv,
    CandidateProfile,
    Education,
    Project,
    setPositionAttributes,
} from './models/models.js';
import type { UserRole } from './types/auth.js';
import { buildSnapshotFromProfile } from './controllers/cvSnapshot.js';
import { validateCvContent } from './schemas/cvContentSchema.js';

const users: Record<'admin' | 'recruiter', { firstName: string; lastName: string; email: string; role: UserRole }> = {
    admin: { firstName: 'Anna', lastName: 'Admin', email: 'admin@demo.com', role: 'ADMIN' },
    recruiter: { firstName: 'Maria', lastName: 'Petrova', email: 'recruiter@demo.com', role: 'RECRUITER' },
};

const attributes = [
    { name: 'React', description: 'React library and ecosystem' },
    { name: 'TypeScript', description: 'Typed JavaScript' },
    { name: 'Node.js', description: 'Server-side JavaScript' },
    { name: 'PostgreSQL', description: 'Relational database' },
    { name: 'Figma', description: 'UI design tool' },
    { name: 'SQL', description: 'Querying relational data' },
    { name: 'Python', description: 'General-purpose language' },
    { name: 'English', description: 'Language level' },
    { name: 'Playwright', description: 'Browser automation and end-to-end testing' },
    { name: 'Docker', description: 'Container development and deployment' },
    { name: 'Accessibility', description: 'Inclusive design and accessibility testing' },
    { name: 'Product Analytics', description: 'Funnels, cohorts and experimentation' },
    { name: 'Technical Writing', description: 'Developer documentation and API guides' },
    { name: 'Next.js', description: 'React framework for server-rendered applications' },
    { name: 'Storybook', description: 'Component documentation and visual review' },
    { name: 'Web Performance', description: 'Performance profiling and Core Web Vitals' },
    { name: 'Redis', description: 'Caching, queues and short-lived state' },
    { name: 'API Design', description: 'API contracts, versioning and idempotency' },
    { name: 'Observability', description: 'Logs, metrics, tracing and alerts' },
];

export const ensureDemo = async () => {
    await sequelize.transaction(async (transaction) => {
        // Serialize demo seed runs, including lookups on tables without unique seed keys.
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
            replacements: { key: 'cvmanager:seed:demo' },
            transaction,
        });

        const ensureUser = async (data: typeof users.admin) => {
            const [user] = await User.findOrCreate({
                where: { email: data.email },
                defaults: { ...data, isActivated: true },
                transaction,
            });
            if (user.role !== data.role) {
                throw new Error(`Demo email ${data.email} already belongs to a user with role ${user.role}`);
            }
            return user;
        };

        await ensureUser(users.admin);
        const recruiter = await ensureUser(users.recruiter);

        const attributeByName: Record<string, Attribute> = {};
        for (const attr of attributes) {
            const [record] = await Attribute.findOrCreate({
                where: { name: attr.name },
                defaults: { ...attr, type: 'Text' },
                transaction,
            });
            attributeByName[attr.name] = record;
        }

        const candidateByEmail = new Map<string, User>();
        for (const { user } of candidates) {
            candidateByEmail.set(user.email, await ensureUser({ ...user, role: 'CANDIDATE' }));
        }

        const positionByTitle: Record<string, Position> = {};
        for (const { skills, allowedEmails, ...data } of positions) {
            const [position, created] = await Position.findOrCreate({
                where: { title: data.title, userId: recruiter.id },
                defaults: { ...data, userIdCreator: recruiter.id, userId: recruiter.id },
                transaction,
            });
            if (created) {
                await setPositionAttributes(position, skills.map((name) => attributeByName[name]), transaction);
                if (allowedEmails) {
                    const allowedCandidates = allowedEmails.map((email) => {
                        const candidate = candidateByEmail.get(email);
                        if (!candidate) throw new Error(`Unknown demo candidate: ${email}`);
                        return candidate;
                    });
                    await position.setAllowedCandidates(allowedCandidates, { transaction });
                }
            }
            positionByTitle[data.title] = position;
        }

        for (const candidate of candidates) {
            const user = candidateByEmail.get(candidate.user.email)!;
            const { id: userId } = user;

            await CandidateProfile.findOrCreate({
                where: { userId },
                defaults: { ...candidate.profile, userId, publicEmail: user.email },
                transaction,
            });

            for (const [name, value] of Object.entries(candidate.skills)) {
                const attributeId = attributeByName[name].id;
                await CandidateSkills.findOrCreate({
                    where: { userId, attributeId },
                    defaults: { userId, attributeId, value },
                    transaction,
                });
            }

            for (const [displayOrder, entry] of candidate.education.entries()) {
                await Education.findOrCreate({
                    where: { userId, institution: entry.institution, startDate: entry.startDate },
                    defaults: { ...entry, userId, displayOrder },
                    transaction,
                });
            }

            for (const [displayOrder, project] of candidate.projects.entries()) {
                await Project.findOrCreate({
                    where: { userId, title: project.title, startDate: project.startDate },
                    defaults: { ...project, userId, displayOrder },
                    transaction,
                });
            }

            const missingCvs = [];
            for (const cv of candidate.cvs) {
                const positionId = positionByTitle[cv.position].id;
                const existing = await Cv.findOne({ where: { userId, positionId }, transaction });
                if (!existing) missingCvs.push({ cv, positionId });
            }
            if (missingCvs.length === 0) continue;

            const content = validateCvContent(await buildSnapshotFromProfile(userId, transaction));
            for (const { cv, positionId } of missingCvs) {
                await Cv.create({
                    userId,
                    positionId,
                    status: cv.status,
                    templateKey: cv.templateKey,
                    content,
                    lastSyncedFromProfileAt: new Date(),
                }, { transaction });
            }
        }
    });

    console.log('OK: demo data is ready.');
};
