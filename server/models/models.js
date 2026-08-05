import sequelize from '../dB.js';
import { DataTypes } from 'sequelize';




const User = sequelize.define('user', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    isActivated: { type: DataTypes.BOOLEAN, defaultValue: false },
    isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
    activationLink: { type: DataTypes.STRING },
    role: {
        type: DataTypes.ENUM("CANDIDATE", "RECRUITER", "ADMIN"),
        defaultValue: "CANDIDATE"
    },
    salesforceAccountId: { type: DataTypes.STRING, allowNull: true },
    salesforceContactId: { type: DataTypes.STRING, allowNull: true }
});

const Position = sequelize.define('position', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    userIdCreator: { type: DataTypes.INTEGER }
});

const Attribute = sequelize.define('candidate_skills_container', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.STRING },
    options: { type: DataTypes.STRING }
});

const CandidateSkills = sequelize.define('candidate_skills', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: { type: DataTypes.TEXT }
});


const Cv = sequelize.define('cv', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    templateKey: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.JSONB, allowNull: true },
    lastSyncedFromProfileAt: { type: DataTypes.DATE, allowNull: true },
});


const PositionAttribute = sequelize.define('position_attribute', {});

const PositionAccess = sequelize.define('position_access', {});

const Project = sequelize.define('project', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    links: { type: DataTypes.JSONB, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: true },
    descriptionMarkdown: { type: DataTypes.TEXT, allowNull: true },
});

const CandidateProfile = sequelize.define('candidate_profile', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    headline: { type: DataTypes.STRING, allowNull: true },
    publicEmail: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    githubUrl: { type: DataTypes.STRING, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING, allowNull: true },
});

const Education = sequelize.define('education', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    institution: { type: DataTypes.STRING, allowNull: true },
    degree: { type: DataTypes.STRING, allowNull: true },
    field: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: true },
});

User.hasMany(Position);
Position.belongsTo(User);

User.hasMany(Cv);
Cv.belongsTo(User);

Position.hasMany(Cv);
Cv.belongsTo(Position);

Position.belongsToMany(Attribute, { through: PositionAttribute, as: 'attributes' });
Attribute.belongsToMany(Position, { through: PositionAttribute, as: 'positions' });


Position.belongsToMany(User, { through: PositionAccess, as: 'allowedCandidates' });
User.belongsToMany(Position, { through: PositionAccess, as: 'accessiblePositions' });


User.hasMany(CandidateSkills);
CandidateSkills.belongsTo(User);

Attribute.hasMany(CandidateSkills);
CandidateSkills.belongsTo(Attribute, { as: 'attribute' });


User.hasMany(Project);
Project.belongsTo(User);

User.hasOne(CandidateProfile, { foreignKey: { name: 'userId', unique: true } });
CandidateProfile.belongsTo(User);

User.hasMany(Education);
Education.belongsTo(User);

export {
    User,
    Position,
    Attribute,
    Cv,
    CandidateSkills,
    PositionAttribute,
    PositionAccess,
    Project,
    CandidateProfile,
    Education,
};
