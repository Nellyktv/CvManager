import sequelize from '../dB.js';
import {
    DataTypes,
    Model,
    type BelongsToManySetAssociationsMixin,
    type CreationOptional,
    type ForeignKey,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute,
} from 'sequelize';
import type { UserRole } from '../types/auth.js';
import type { CvContent } from '../schemas/cvContentSchema.js';

export interface CvLink {
    label: string;
    url: string;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare firstName: string | null;
    declare lastName: string | null;
    declare email: string;
    declare password: CreationOptional<string | null>;
    declare isActivated: CreationOptional<boolean>;
    declare isBlocked: CreationOptional<boolean>;
    declare activationLink: CreationOptional<string | null>;
    declare role: CreationOptional<UserRole>;
    declare salesforceAccountId: CreationOptional<string | null>;
    declare salesforceContactId: CreationOptional<string | null>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

User.init({
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
    salesforceContactId: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'user' });

class Position extends Model<InferAttributes<Position>, InferCreationAttributes<Position>> {
    declare id: CreationOptional<number>;
    declare title: string;
    declare description: string | null;
    declare userIdCreator: number | null;
    declare userId: ForeignKey<User['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;

    declare attributes?: NonAttribute<Attribute[]>;
    declare allowedCandidates?: NonAttribute<User[]>;
    declare setAllowedCandidates: BelongsToManySetAssociationsMixin<User, number>;
}

Position.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    userIdCreator: { type: DataTypes.INTEGER },
}, { sequelize, modelName: 'position' });

class Attribute extends Model<InferAttributes<Attribute>, InferCreationAttributes<Attribute>> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare description: string | null;
    declare type: string;
    declare options: string | null;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

Attribute.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.STRING },
    options: { type: DataTypes.STRING },
}, { sequelize, modelName: 'candidate_skills_container' });

class CandidateSkills extends Model<InferAttributes<CandidateSkills>, InferCreationAttributes<CandidateSkills>> {
    declare id: CreationOptional<number>;
    declare value: string | null;
    declare userId: ForeignKey<User['id']>;
    declare attributeId: ForeignKey<Attribute['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;

    declare attribute?: NonAttribute<Attribute>;
}

CandidateSkills.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    value: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'candidate_skills' });

export type CvStatus = 'draft' | 'published';

class Cv extends Model<InferAttributes<Cv>, InferCreationAttributes<Cv>> {
    declare id: CreationOptional<number>;
    declare version: CreationOptional<number>;
    declare status: CreationOptional<CvStatus>;
    declare templateKey: string | null;
    declare content: CvContent | null;
    declare lastSyncedFromProfileAt: Date | null;
    declare userId: ForeignKey<User['id']>;
    declare positionId: ForeignKey<Position['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

Cv.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    templateKey: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.JSONB, allowNull: true },
    lastSyncedFromProfileAt: { type: DataTypes.DATE, allowNull: true },
}, { sequelize, modelName: 'cv' });

const PositionAttribute = sequelize.define('position_attribute', {});

const PositionAccess = sequelize.define('position_access', {});

class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
    declare id: CreationOptional<number>;
    declare title: string;
    declare role: string | null;
    declare startDate: string | null;
    declare endDate: string | null;
    declare links: CvLink[] | null;
    declare displayOrder: number | null;
    declare descriptionMarkdown: string | null;
    declare userId: ForeignKey<User['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

Project.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    links: { type: DataTypes.JSONB, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: true },
    descriptionMarkdown: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, modelName: 'project' });

class CandidateProfile extends Model<InferAttributes<CandidateProfile>, InferCreationAttributes<CandidateProfile>> {
    declare id: CreationOptional<number>;
    declare headline: string | null;
    declare publicEmail: string | null;
    declare phone: string | null;
    declare location: string | null;
    declare linkedinUrl: string | null;
    declare githubUrl: string | null;
    declare portfolioUrl: string | null;
    declare userId: ForeignKey<User['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

CandidateProfile.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    headline: { type: DataTypes.STRING, allowNull: true },
    publicEmail: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    linkedinUrl: { type: DataTypes.STRING, allowNull: true },
    githubUrl: { type: DataTypes.STRING, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING, allowNull: true },
}, { sequelize, modelName: 'candidate_profile' });

class Education extends Model<InferAttributes<Education>, InferCreationAttributes<Education>> {
    declare id: CreationOptional<number>;
    declare institution: string | null;
    declare degree: string | null;
    declare field: string | null;
    declare location: string | null;
    declare startDate: string | null;
    declare endDate: string | null;
    declare description: string | null;
    declare displayOrder: number | null;
    declare userId: ForeignKey<User['id']>;
    declare createdAt: NonAttribute<Date>;
    declare updatedAt: NonAttribute<Date>;
}

Education.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    institution: { type: DataTypes.STRING, allowNull: true },
    degree: { type: DataTypes.STRING, allowNull: true },
    field: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    endDate: { type: DataTypes.DATEONLY, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    displayOrder: { type: DataTypes.INTEGER, allowNull: true },
}, { sequelize, modelName: 'education' });

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

const profileForeignKey = { name: 'userId', unique: true };
User.hasOne(CandidateProfile, { foreignKey: profileForeignKey });
CandidateProfile.belongsTo(User);

User.hasMany(Education);
Education.belongsTo(User);

const setPositionAttributes = (position: Position, attributes: Array<Attribute | number>) =>
    (position as unknown as { setAttributes: BelongsToManySetAssociationsMixin<Attribute, number> })
        .setAttributes(attributes);

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
    setPositionAttributes,
};
