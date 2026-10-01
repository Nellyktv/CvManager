import 'dotenv/config';
import bcrypt from 'bcrypt';
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

const DEMO_PASSWORD = 'Demo1234!';

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
];

const positions = [
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
        cvs: [{ position: 'Data Analyst', status: 'published', templateKey: 'structured-minimal' }],
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
];

const run = async () => {
    const existing = await User.findOne({ where: { email: users.admin.email } });
    if (existing) {
        console.log('Demo data already exists, nothing to do');
        await sequelize.close();
        return;
    }

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);

    await User.create({ ...users.admin, password, isActivated: true });
    const recruiter = await User.create({ ...users.recruiter, password, isActivated: true });

    const attributeByName: Record<string, Attribute> = {};
    for (const attr of attributes) {
        const [record] = await Attribute.findOrCreate({
            where: { name: attr.name },
            defaults: { ...attr, type: 'Text' },
        });
        attributeByName[attr.name] = record;
    }

    const positionByTitle: Record<string, Position> = {};
    for (const { skills, ...data } of positions) {
        const position = await Position.create({ ...data, userIdCreator: recruiter.id, userId: recruiter.id });
        await setPositionAttributes(position, skills.map((name) => attributeByName[name]));
        positionByTitle[data.title] = position;
    }

    for (const candidate of candidates) {
        const user = await User.create({
            ...candidate.user,
            password,
            role: 'CANDIDATE',
            isActivated: true,
        });

        await CandidateProfile.create({
            ...candidate.profile,
            userId: user.id,
            publicEmail: user.email,
        });

        for (const [name, value] of Object.entries(candidate.skills)) {
            await CandidateSkills.create({
                userId: user.id,
                attributeId: attributeByName[name].id,
                value,
            });
        }

        for (const [index, entry] of candidate.education.entries()) {
            await Education.create({ ...entry, userId: user.id, displayOrder: index });
        }

        for (const [index, project] of candidate.projects.entries()) {
            await Project.create({ ...project, userId: user.id, displayOrder: index });
        }

        const content = validateCvContent(await buildSnapshotFromProfile(user.id));
        for (const cv of candidate.cvs) {
            await Cv.create({
                userId: user.id,
                positionId: positionByTitle[cv.position].id,
                status: cv.status,
                templateKey: cv.templateKey,
                content,
                lastSyncedFromProfileAt: new Date(),
            });
        }
    }

    console.log(`OK: demo data created. Password for all demo users: ${DEMO_PASSWORD}`);
    await sequelize.close();
};

run();
