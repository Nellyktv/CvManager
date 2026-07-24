import 'dotenv/config';
import sequelize from './dB.js';
import { User, Position, Cv } from './models/models.js';

const run = async () => {
   const recruiter = await User.findOne({ where: { role: 'RECRUITER' } });

    const position1 = await Position.create({
        title: 'Frontend Developer',
        description: 'React, TypeScript',
        visibility: 'public',
        userIdCreator: recruiter.id,
    });

    const position2 = await Position.create({
        title: 'Business Analyst',
        description: 'Requirements, GPA',
        visibility: 'public',
        userIdCreator: recruiter.id,
    });

    const candidates = await User.findAll({ where: { role: 'CANDIDATE' } });

    for (const candidate of candidates) {
        await Cv.create({
            version: 1,
            userId: candidate.id,
            positionId: position1.id,
        });
    }

    await Cv.create({
        version: 1,
        userId: candidates[0].id,
        positionId: position2.id,
    });

    console.log('OK: создано 2 позиции и несколько CV');
    await sequelize.close();
};

run();
