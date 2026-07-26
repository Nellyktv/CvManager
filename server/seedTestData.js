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

    const profile = await CandidateProfile.create({
        userId: fixtureCandidate.id,
        headline: 'Frontend Engineer',
        publicEmail: fixtureCandidate.email,
        phone: '+370 600 00000',
        location: 'Vilnius, Lithuania',
        linkedinUrl: 'https://linkedin.com/in/example',
        githubUrl: 'https://github.com/example',
        portfolioUrl: 'https://example.dev',
    });

    const education = await Education.create({
        userId: fixtureCandidate.id,
        institution: 'Vilnius University',
        degree: 'BSc',
        field: 'Computer Science',
        location: 'Vilnius',
        startDate: '2018-09-01',
        endDate: '2022-06-30',
        description: 'Software engineering track',
        displayOrder: 0,
    });

    const project = await Project.create({
        userId: fixtureCandidate.id,
        title: 'CV Manager',
        role: 'Full-stack developer',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        links: [{ label: 'Repo', url: 'https://github.com/example/cv-manager' }],
        displayOrder: 0,
        descriptionMarkdown: 'Built a **CV workspace** with preview and PDF export.',
    });

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
