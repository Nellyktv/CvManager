import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Sequelize } from 'sequelize';
import { expect, it } from 'vitest';

const runNode = promisify(execFile);
const serverDirectory = fileURLToPath(new URL('./', import.meta.url));

it.skipIf(process.env.CV_SEED_INTEGRATION !== '1')(
    'resumes an interrupted seed and leaves existing edits intact on rerun',
    async () => {
        const database = `cvmanager_seed_${randomUUID().replaceAll('-', '')}`;
        const user = process.env.DB_USER ?? 'cv_manager';
        const password = process.env.DB_PASSWORD ?? 'cv_manager';
        const options = {
            dialect: 'postgres' as const,
            host: process.env.DB_HOST ?? '127.0.0.1',
            port: Number(process.env.DB_PORT ?? '5437'),
            logging: false as const,
        };
        const admin = new Sequelize('postgres', user, password, options);
        try {
            await admin.query(`CREATE DATABASE "${database}"`);
            const db = new Sequelize(database, user, password, options);
            try {
                const env = {
                    ...process.env,
                    DB_NAME: database,
                    DB_USER: user,
                    DB_PASSWORD: password,
                    DB_HOST: options.host,
                    DB_PORT: String(options.port),
                };
                const runTs = (...args: string[]) =>
                    runNode(process.execPath, ['--import', 'tsx', ...args], { cwd: serverDirectory, env });

                await runTs('--input-type=module', '-e', `
                    import { User } from './models/models.ts';
                    import db from './dB.ts';
                    await db.sync();
                    await User.create({
                        email: 'admin@demo.com', role: 'ADMIN', isActivated: true,
                        firstName: 'Existing', lastName: 'Admin',
                    });
                    await db.close();
                `);

                await runTs('seedDemo.ts');
                await db.query(`UPDATE cvs SET status = 'draft' WHERE id = (SELECT min(id) FROM cvs)`);
                await Promise.all([runTs('seedDemo.ts'), runTs('seedDemo.ts')]);

                const [rows] = await db.query(`
                    SELECT
                        (SELECT count(*)::int FROM users) AS users,
                        (SELECT count(*)::int FROM positions) AS positions,
                        (SELECT count(*)::int FROM candidate_profiles) AS profiles,
                        (SELECT count(*)::int FROM cvs) AS cvs,
                        (SELECT count(*)::int FROM cvs WHERE status = 'draft') AS drafts,
                        (SELECT count(*)::int FROM cvs WHERE content->'contact'->>'name' <> '') AS snapshots,
                        (SELECT count(*)::int FROM position_accesses) AS invitations,
                        (SELECT count(*)::int FROM cvs JOIN positions ON positions.id = cvs."positionId"
                            WHERE positions.title = 'Frontend Developer' AND cvs.status = 'published') AS frontend_published,
                        (SELECT count(*)::int FROM cvs JOIN positions ON positions.id = cvs."positionId"
                            WHERE positions.title = 'Technical Writer' AND cvs.status = 'draft') AS writer_drafts,
                        (SELECT count(*)::int FROM cvs JOIN positions ON positions.id = cvs."positionId"
                            WHERE positions.title = 'Platform Engineer') AS platform_cvs,
                        (SELECT count(*)::int FROM cvs JOIN positions ON positions.id = cvs."positionId"
                            WHERE positions.title = 'Senior React Engineer' AND cvs.status = 'published') AS react_cvs,
                        (SELECT count(*)::int FROM cvs JOIN positions ON positions.id = cvs."positionId"
                            WHERE positions.title = 'Node.js API Engineer' AND cvs.status = 'published') AS api_cvs,
                        (SELECT "firstName" FROM users WHERE email = 'admin@demo.com') AS admin_name
                `);
                expect(rows).toEqual([{
                    users: 9, positions: 15, profiles: 7, cvs: 20, drafts: 6,
                    snapshots: 20, invitations: 2, frontend_published: 2, writer_drafts: 1,
                    platform_cvs: 0, react_cvs: 2, api_cvs: 1, admin_name: 'Existing',
                }]);
            } finally {
                await db.close();
                await admin.query(`DROP DATABASE "${database}"`);
            }
        } finally {
            await admin.close();
        }
    },
    20_000,
);
