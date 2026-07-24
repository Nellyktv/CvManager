import {
  Attribute,
  CandidateProfile,
  CandidateSkills,
  Education,
  Project,
  User,
} from '../models/models.js';
import { sanitizeLegacyMarkdown } from '../schemas/cvContentSchema.js';

const optionalString = (value) => {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : undefined;
};

const composeName = (firstName, lastName) => {
  const parts = [firstName, lastName]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean);
  return parts.join(' ');
};

const profileLinks = (profile) => {
  const links = [];
  if (!profile) return links;

  const linkedinUrl = optionalString(profile.linkedinUrl);
  const githubUrl = optionalString(profile.githubUrl);
  const portfolioUrl = optionalString(profile.portfolioUrl);

  if (linkedinUrl) links.push({ label: 'LinkedIn', url: linkedinUrl });
  if (githubUrl) links.push({ label: 'GitHub', url: githubUrl });
  if (portfolioUrl) links.push({ label: 'Portfolio', url: portfolioUrl });

  return links;
};

const mapEducation = (entry) => {
  const institution = optionalString(entry.institution) ?? '';
  const mapped = { institution };

  const degree = optionalString(entry.degree);
  const field = optionalString(entry.field);
  const location = optionalString(entry.location);
  const startDate = optionalString(entry.startDate);
  const endDate = optionalString(entry.endDate);
  const description = optionalString(entry.description);

  if (degree) mapped.degree = degree;
  if (field) mapped.field = field;
  if (location) mapped.location = location;
  if (startDate) mapped.startDate = startDate;
  if (endDate) mapped.endDate = endDate;
  if (description) mapped.description = description;

  return mapped;
};

const mapProject = (project) => {
  const title = optionalString(project.title);
  if (!title) return null;

  const mapped = {
    title,
    links: Array.isArray(project.links)
      ? project.links.map((link) => ({ label: link.label, url: link.url }))
      : [],
  };

  const role = optionalString(project.role);
  const startDate = optionalString(project.startDate);
  const endDate = optionalString(project.endDate);
  const descriptionMarkdown =
    optionalString(project.descriptionMarkdown) ??
    optionalString(sanitizeLegacyMarkdown(project.description));

  if (role) mapped.role = role;
  if (startDate) mapped.startDate = startDate;
  if (endDate) mapped.endDate = endDate;
  if (descriptionMarkdown) mapped.descriptionMarkdown = descriptionMarkdown;

  return mapped;
};

const mapSkill = (skill) => {
  const label = optionalString(skill.attribute?.name) ?? '';
  const mapped = { label };
  const value = optionalString(skill.value);
  if (value) mapped.value = value;
  return mapped;
};

export const buildSnapshotFromProfile = async (userId) => {
  const [user, profile, skills, education, projects] = await Promise.all([
    User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName'] }),
    CandidateProfile.findOne({ where: { userId } }),
    CandidateSkills.findAll({
      where: { userId },
      include: [{ model: Attribute, as: 'attribute' }],
    }),
    Education.findAll({
      where: { userId },
      order: [
        ['displayOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    }),
    Project.findAll({
      where: { userId },
      order: [
        ['displayOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    }),
  ]);

  const contact = {
    name: composeName(user?.firstName, user?.lastName),
    links: profileLinks(profile),
  };

  const headline = optionalString(profile?.headline);
  const email = optionalString(profile?.publicEmail);
  const phone = optionalString(profile?.phone);
  const location = optionalString(profile?.location);

  if (headline) contact.headline = headline;
  if (email) contact.email = email;
  if (phone) contact.phone = phone;
  if (location) contact.location = location;

  return {
    contact,
    skills: skills.map(mapSkill),
    education: education.map(mapEducation),
    projects: projects.map(mapProject).filter(Boolean),
  };
};

export const mergeSnapshotSections = (existing, defaults, sections) => {
  const next = structuredClone(existing);

  for (const section of sections) {
    if (section === 'contact') next.contact = structuredClone(defaults.contact);
    if (section === 'skills') next.skills = structuredClone(defaults.skills);
    if (section === 'education') next.education = structuredClone(defaults.education);
    if (section === 'projects') next.projects = structuredClone(defaults.projects);
  }

  return next;
};

export const isSnapshotComplete = (content) =>
  Boolean(
    content.contact.name.trim() &&
      content.contact.email?.trim() &&
      content.education.some((entry) => Boolean(String(entry.institution ?? '').trim())),
  );
