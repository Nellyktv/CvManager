import 'dotenv/config';
import sequelize from './dB.js';
import {
    User,
    Position,
    Cv,
    CandidateProfile,
    Education,
    Project,
} from './models/models.js';

const run = async () => {
    const recruiter = await User.findOne({ where: { role: 'RECRUITER' } });
    if (!recruiter) {
        throw new Error('Create a RECRUITER user first (see setRole.ts)');
    }

    const position1 = await Position.create({
        title: 'Frontend Developer',
        description: 'React, TypeScript',
        userIdCreator: recruiter.id,
    });

    const position2 = await Position.create({
        title: 'Business Analyst',
        description: 'Requirements, GPA',
        userIdCreator: recruiter.id,
    });

    const candidates = await User.findAll({ where: { role: 'CANDIDATE' } });
    const fixtureCandidate = candidates[0];
    if (!fixtureCandidate) {
        throw new Error('Create at least one CANDIDATE user first');
    }

    for (const candidate of candidates) {
        await Cv.create({
            version: 1,
            userId: candidate.id,
            positionId: position1.id,
        });
    }

    await Cv.create({
        version: 1,
        userId: fixtureCandidate.id,
        positionId: position2.id,
    });

    const profile = {
        headline: 'Frontend Developer',
        publicEmail: fixtureCandidate.email,
        phone: '+7 999 123-45-67',
        location: 'Москва, Россия',
        linkedinUrl: 'https://linkedin.com/in/ivan-ivanov',
        githubUrl: 'https://github.com/ivan-ivanov',
        portfolioUrl: 'https://ivanivanov.dev',
    };
    await CandidateProfile.create({ ...profile, userId: fixtureCandidate.id });

    const education = {
        institution: 'МГУ им. М.В. Ломоносова',
        degree: 'Бакалавр',
        field: 'Компьютерные науки',
        location: 'Москва',
        startDate: '2018-09-01',
        endDate: '2022-06-30',
        description: 'Разработка ПО',
    };
    await Education.create({ ...education, userId: fixtureCandidate.id, displayOrder: 0 });

    const project = {
        title: 'CV Manager',
        role: 'Full-stack developer',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        links: [{ label: 'Repo', url: 'https://github.com/ivan-ivanov/cv-manager' }],
        descriptionMarkdown: 'Built a **CV workspace** with preview and PDF export.',
    };
    await Project.create({ ...project, userId: fixtureCandidate.id, displayOrder: 0 });

    const content = {
        contact: {
            name: [fixtureCandidate.firstName, fixtureCandidate.lastName]
                .filter(Boolean)
                .join(' '),
            headline: profile.headline,
            email: profile.publicEmail,
            phone: profile.phone,
            location: profile.location,
            links: [
                { label: 'LinkedIn', url: profile.linkedinUrl },
                { label: 'GitHub', url: profile.githubUrl },
                { label: 'Portfolio', url: profile.portfolioUrl },
            ],
        },
        skills: [{ label: 'TypeScript', value: 'Advanced' }, { label: 'React' }],
        education: [
            {
                institution: education.institution,
                degree: education.degree,
                field: education.field,
                location: education.location,
                startDate: education.startDate,
                endDate: education.endDate,
                description: education.description,
            },
        ],
        projects: [
            {
                title: project.title,
                role: project.role,
                startDate: project.startDate,
                endDate: project.endDate,
                links: project.links,
                descriptionMarkdown: project.descriptionMarkdown,
            },
        ],
    };

    await Cv.create({
        version: 1,
        userId: fixtureCandidate.id,
        positionId: position1.id,
        status: 'draft',
        templateKey: 'editorial-sidebar',
        content,
        lastSyncedFromProfileAt: new Date(),
    });

    console.log('OK: создано 2 позиции, CV, профиль, образование и расширенный проект');
    await sequelize.close();
};

run();
