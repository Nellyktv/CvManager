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
    }
});

const Position = sequelize.define('position', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    visibility: { type: DataTypes.STRING },
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
    status: { type: DataTypes.STRING, defaultValue: 'draft' }
});


const PositionAttribute = sequelize.define('position_attribute', {});

const PositionAccess = sequelize.define('position_access', {});

const Comment = sequelize.define('comment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    text: { type: DataTypes.TEXT }
});

const Project = sequelize.define('project', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT }
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


Cv.hasMany(Comment);
Comment.belongsTo(Cv);

User.hasMany(Comment);
Comment.belongsTo(User);


User.hasMany(Project);
Project.belongsTo(User);

export { User, Position, Attribute, Cv, CandidateSkills, PositionAttribute, PositionAccess, Comment, Project };