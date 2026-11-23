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
    type CvStatus,
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

const positions: Array<{
    title: string;
    description: string;
    skills: string[];
    allowedEmails?: string[];
}> = [
    {
        title: 'Frontend Developer',
        description: 'Build user interfaces for our SaaS product with React and TypeScript.',
        skills: ['React', 'TypeScript', 'English'],
    },
    {
        title: 'Full-stack Developer',
        description: 'Work on the React frontend and the Node.js API with PostgreSQL.',
        skills: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
        title: 'Data Analyst',
        description: 'Analyze product metrics and build dashboards.',
        skills: ['SQL', 'Python', 'English'],
    },
    {
        title: 'UI/UX Designer',
        description: 'Design web and mobile interfaces, run user research.',
        skills: ['Figma', 'English'],
    },
    {
        title: 'Backend Engineer',
        description: 'Build and maintain the billing API for a fictional subscription platform. Own PostgreSQL migrations, background jobs and API reliability.',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    },
    {
        title: 'QA Automation Engineer',
        description: 'Design browser regression tests for checkout and account management. This vacancy is visible to invited candidates.',
        skills: ['Playwright', 'TypeScript', 'Accessibility'],
        allowedEmails: ['candidate@demo.com', 'qa@demo.com'],
    },
    {
        title: 'Product Analyst',
        description: 'Build activation funnels, validate experiments and help the product team prioritize improvements.',
        skills: ['Product Analytics', 'SQL', 'Python'],
    },
    {
        title: 'Technical Writer',
        description: 'Write onboarding guides and API reference examples for a developer platform.',
        skills: ['Technical Writing', 'English'],
    },
    {
        title: 'Platform Engineer',
        description: 'Improve deployments, container builds and monitoring for a growing engineering team.',
        skills: ['Docker', 'PostgreSQL', 'Node.js'],
    },
    {
        title: 'Senior React Engineer',
        description: 'Lead the frontend of a subscription dashboard. Improve rendering performance, define component boundaries and mentor engineers through code reviews.',
        skills: ['React', 'TypeScript', 'Next.js', 'Web Performance'],
    },
    {
        title: 'Design Systems Engineer',
        description: 'Build an accessible component library for three product teams. Document variants and add visual and keyboard-navigation regression tests.',
        skills: ['React', 'TypeScript', 'Storybook', 'Accessibility'],
    },
    {
        title: 'Frontend Performance Engineer',
        description: 'Measure storefront performance on low-end phones. Prioritize asset size, rendering bottlenecks and interaction latency.',
        skills: ['Web Performance', 'Next.js', 'Playwright'],
    },
    {
        title: 'Node.js API Engineer',
        description: 'Build versioned endpoints for a marketplace. Own contracts, transaction boundaries and integration tests for order processing.',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'API Design'],
    },
    {
        title: 'Backend Integrations Engineer',
        description: 'Maintain webhooks and background workers for payment and inventory partners. Design retries, deduplication and incident dashboards.',
        skills: ['Node.js', 'API Design', 'Redis', 'Observability'],
    },
    {
        title: 'Backend Data Engineer',
        description: 'Improve the reporting pipeline from PostgreSQL to analytics. Tune slow queries, handle retries and monitor freshness.',
        skills: ['PostgreSQL', 'SQL', 'Python', 'Observability'],
    },
];

interface DemoCandidate {
    user: { firstName: string; lastName: string; email: string };
    profile: Partial<Record<'headline' | 'phone' | 'location' | 'linkedinUrl' | 'githubUrl' | 'portfolioUrl', string>>;
    skills: Record<string, string>;
    education: Array<{ institution: string; degree: string; field: string; location: string; startDate: string; endDate: string }>;
    projects: Array<{ title: string; role: string; startDate: string; endDate: string; links: Array<{ label: string; url: string }>; descriptionMarkdown: string }>;
    cvs: Array<{ position: string; status: CvStatus; templateKey: 'editorial-sidebar' | 'structured-minimal' }>;
}

const candidates: DemoCandidate[] = [
    {
        user: { firstName: 'Ivan', lastName: 'Ivanov', email: 'candidate@demo.com' },
        profile: {
            headline: 'Frontend Developer',
            phone: '+7 999 123-45-67',
            location: 'Moscow, Russia',
            linkedinUrl: 'https://linkedin.com/in/ivan-ivanov',
            githubUrl: 'https://github.com/ivan-ivanov',
        },
        skills: { React: 'Advanced', TypeScript: 'Advanced', 'Node.js': 'Intermediate', English: 'B2' },
        education: [
            {
                institution: 'Lomonosov Moscow State University',
                degree: 'Bachelor',
                field: 'Computer Science',
                location: 'Moscow',
                startDate: '2018-09-01',
                endDate: '2022-06-30',
            },
        ],
        projects: [
            {
                title: 'Online Store',
                role: 'Frontend Developer',
                startDate: '2023-02-01',
                endDate: '2024-05-31',
                links: [{ label: 'GitHub', url: 'https://github.com/ivan-ivanov/store' }],
                descriptionMarkdown:
                    'E-commerce web app with a **product catalog**, cart and checkout.\n\n- React, TypeScript, Redux Toolkit\n- Reduced page load time by *40%*',
            },
            {
                title: 'Task Tracker',
                role: 'Full-stack Developer',
                startDate: '2024-06-01',
                endDate: '2025-03-31',
                links: [],
                descriptionMarkdown:
                    'Kanban board with drag and drop and real-time updates.\n\n- React, Node.js, PostgreSQL\n- WebSocket notifications',
            },
        ],
        cvs: [
            { position: 'Frontend Developer', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Full-stack Developer', status: 'draft', templateKey: 'structured-minimal' },
            { position: 'QA Automation Engineer', status: 'draft', templateKey: 'editorial-sidebar' },
            { position: 'Senior React Engineer', status: 'published', templateKey: 'structured-minimal' },
        ],
    },
    {
        user: { firstName: 'Olga', lastName: 'Smirnova', email: 'olga.smirnova@demo.com' },
        profile: {
            headline: 'Data Analyst',
            phone: '+7 912 555-01-02',
            location: 'Saint Petersburg, Russia',
            linkedinUrl: 'https://linkedin.com/in/olga-smirnova',
        },
        skills: { SQL: 'Advanced', Python: 'Intermediate', English: 'C1' },
        education: [
            {
                institution: 'HSE University',
                degree: 'Master',
                field: 'Applied Mathematics',
                location: 'Saint Petersburg',
                startDate: '2019-09-01',
                endDate: '2021-06-30',
            },
        ],
        projects: [
            {
                title: 'Sales Dashboard',
                role: 'Data Analyst',
                startDate: '2022-01-01',
                endDate: '2024-12-31',
                links: [],
                descriptionMarkdown:
                    'Built **sales dashboards** for 12 regional teams.\n\n- SQL, Python, Metabase\n- Automated weekly reports',
            },
        ],
        cvs: [
            { position: 'Data Analyst', status: 'published', templateKey: 'structured-minimal' },
            { position: 'Product Analyst', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Technical Writer', status: 'draft', templateKey: 'structured-minimal' },
            { position: 'Backend Data Engineer', status: 'published', templateKey: 'editorial-sidebar' },
        ],
    },
    {
        user: { firstName: 'Dmitry', lastName: 'Kozlov', email: 'dmitry.kozlov@demo.com' },
        profile: {
            headline: 'UI/UX Designer',
            phone: '+7 921 777-88-99',
            location: 'Kazan, Russia',
            portfolioUrl: 'https://dribbble.com/dmitry-kozlov',
        },
        skills: { Figma: 'Advanced', React: 'Beginner', English: 'B1' },
        education: [
            {
                institution: 'Kazan Federal University',
                degree: 'Bachelor',
                field: 'Graphic Design',
                location: 'Kazan',
                startDate: '2017-09-01',
                endDate: '2021-06-30',
            },
        ],
        projects: [
            {
                title: 'Banking App Redesign',
                role: 'UI/UX Designer',
                startDate: '2023-03-01',
                endDate: '2024-02-28',
                links: [],
                descriptionMarkdown:
                    'Redesigned a mobile banking app.\n\n- User interviews and usability tests\n- Design system in **Figma**',
            },
        ],
        cvs: [
            { position: 'UI/UX Designer', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Frontend Developer', status: 'published', templateKey: 'structured-minimal' },
        ],
    },
    {
        user: { firstName: 'Nina', lastName: 'Volkova', email: 'qa@demo.com' },
        profile: {
            headline: 'QA Automation Engineer',
            location: 'Minsk, Belarus',
            portfolioUrl: 'https://example.com/qa-portfolio',
        },
        skills: { Playwright: 'Advanced', TypeScript: 'Advanced', Accessibility: 'Intermediate', English: 'C1' },
        education: [
            {
                institution: 'Northbridge Institute of Technology',
                degree: 'Bachelor',
                field: 'Software Engineering',
                location: 'Minsk',
                startDate: '2017-09-01',
                endDate: '2021-06-30',
            },
        ],
        projects: [
            {
                title: 'Checkout Regression Suite',
                role: 'QA Automation Engineer',
                startDate: '2023-03-01',
                endDate: '2025-08-30',
                links: [{ label: 'Sample test plan', url: 'https://example.com/checkout-tests' }],
                descriptionMarkdown: 'Built **browser regression coverage** for checkout and account recovery.\n\n- Ran accessibility checks alongside smoke tests\n- Added an isolated test database to CI',
            },
        ],
        cvs: [
            { position: 'QA Automation Engineer', status: 'published', templateKey: 'structured-minimal' },
            { position: 'Frontend Developer', status: 'published', templateKey: 'editorial-sidebar' },
        ],
    },
    {
        user: { firstName: 'Maxim', lastName: 'Orlov', email: 'backend@demo.com' },
        profile: {
            headline: 'Backend Engineer',
            location: 'Warsaw, Poland',
            githubUrl: 'https://example.com/backend-portfolio',
        },
        skills: { 'Node.js': 'Advanced', TypeScript: 'Advanced', PostgreSQL: 'Advanced', Docker: 'Intermediate' },
        education: [
            {
                institution: 'Vistula School of Computing',
                degree: 'Master',
                field: 'Distributed Systems',
                location: 'Warsaw',
                startDate: '2018-10-01',
                endDate: '2020-06-30',
            },
        ],
        projects: [
            {
                title: 'Subscription Billing API',
                role: 'Backend Engineer',
                startDate: '2022-01-10',
                endDate: '2025-09-30',
                links: [{ label: 'Sample API guide', url: 'https://example.com/billing-api' }],
                descriptionMarkdown: 'Designed a **billing API** and migrated recurring jobs to a reliable queue.\n\n- Used PostgreSQL constraints for consistency\n- Added retry handling and operational metrics',
            },
        ],
        cvs: [
            { position: 'Backend Engineer', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Full-stack Developer', status: 'published', templateKey: 'structured-minimal' },
        ],
    },
    {
        user: { firstName: 'Elena', lastName: 'Morozova', email: 'frontend@demo.com' },
        profile: { headline: 'Senior Frontend Engineer', location: 'Vilnius, Lithuania', portfolioUrl: 'https://example.com/frontend-portfolio' },
        skills: { React: 'Advanced', TypeScript: 'Advanced', 'Next.js': 'Advanced', Storybook: 'Advanced', Accessibility: 'Advanced', 'Web Performance': 'Advanced', Playwright: 'Intermediate' },
        education: [{
            institution: 'Baltic Institute of Digital Design', degree: 'Bachelor', field: 'Software Engineering',
            location: 'Vilnius', startDate: '2016-09-01', endDate: '2020-06-30',
        }],
        projects: [
            {
                title: 'Atlas Design System', role: 'Frontend Tech Lead', startDate: '2023-03-01', endDate: '2025-07-31',
                links: [{ label: 'Example component docs', url: 'https://example.com/atlas-components' }],
                descriptionMarkdown: 'Built a **shared React component library** used by three fictional product teams.\n\n- Documented tokens and component states in Storybook\n- Added keyboard navigation and accessibility checks\n- Reduced duplicated components across product teams',
            },
            {
                title: 'Harbor Storefront', role: 'Senior Frontend Engineer', startDate: '2021-04-01', endDate: '2023-02-28',
                links: [],
                descriptionMarkdown: 'Migrated product pages to **Next.js** and improved mobile responsiveness.\n\n- Split heavy components by route\n- Tracked layout shifts and interaction latency\n- Added browser tests for checkout',
            },
        ],
        cvs: [
            { position: 'Senior React Engineer', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Design Systems Engineer', status: 'published', templateKey: 'structured-minimal' },
            { position: 'Frontend Performance Engineer', status: 'draft', templateKey: 'editorial-sidebar' },
        ],
    },
    {
        user: { firstName: 'Anton', lastName: 'Lebedev', email: 'api.engineer@demo.com' },
        profile: { headline: 'Backend Engineer, APIs and Integrations', location: 'Riga, Latvia', portfolioUrl: 'https://example.com/api-portfolio' },
        skills: { 'Node.js': 'Advanced', TypeScript: 'Advanced', PostgreSQL: 'Advanced', Redis: 'Advanced', 'API Design': 'Advanced', Observability: 'Advanced', Docker: 'Intermediate' },
        education: [{
            institution: 'Daugava School of Computing', degree: 'Bachelor', field: 'Computer Science',
            location: 'Riga', startDate: '2015-09-01', endDate: '2019-06-30',
        }],
        projects: [
            {
                title: 'Dockside Partner API', role: 'Backend Engineer', startDate: '2023-01-10', endDate: '2025-08-31',
                links: [{ label: 'Example API reference', url: 'https://example.com/dockside-api' }],
                descriptionMarkdown: 'Designed a **versioned REST API** with clear order and inventory contracts.\n\n- Used PostgreSQL transactions for order consistency\n- Added idempotency to duplicate deliveries\n- Documented error responses and migration steps',
            },
            {
                title: 'Relay Webhook Workers', role: 'Integrations Engineer', startDate: '2021-03-01', endDate: '2022-12-31',
                links: [],
                descriptionMarkdown: 'Built **background workers** for fictional payment partners.\n\n- Added retries and failed-job handling\n- Exposed operational metrics and trace IDs\n- Tested timeouts and duplicate event delivery',
            },
        ],
        cvs: [
            { position: 'Node.js API Engineer', status: 'published', templateKey: 'structured-minimal' },
            { position: 'Backend Integrations Engineer', status: 'published', templateKey: 'editorial-sidebar' },
            { position: 'Backend Data Engineer', status: 'draft', templateKey: 'structured-minimal' },
        ],
    },
];

const run = async () => {
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

run().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => sequelize.close());
