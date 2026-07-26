import {
  Attribute,
  CandidateProfile,
  CandidateSkills,
  Education,
  Project,
  User,
} from '../models/models.js';
const asString = (value) => (value == null ? '' : String(value).trim());

const composeName = (firstName, lastName) => {
  const parts = [firstName, lastName]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean);
  return parts.join(' ');
};

const profileLinks = (profile) => {
  const links = [];
  if (!profile) return links;

  const linkedinUrl = asString(profile.linkedinUrl);
  const githubUrl = asString(profile.githubUrl);
  const portfolioUrl = asString(profile.portfolioUrl);

  if (linkedinUrl) links.push({ label: 'LinkedIn', url: linkedinUrl });
  if (githubUrl) links.push({ label: 'GitHub', url: githubUrl });
  if (portfolioUrl) links.push({ label: 'Portfolio', url: portfolioUrl });

  return links;
};

const mapEducation = (entry) => ({
  institution: asString(entry.institution),
  degree: asString(entry.degree),
  field: asString(entry.field),
  location: asString(entry.location),
  startDate: asString(entry.startDate),
  endDate: asString(entry.endDate),
  description: asString(entry.description),
});

const mapProject = (project) => {
  const title = asString(project.title);
  if (!title) return null;

  return {
    title,
    role: asString(project.role),
    startDate: asString(project.startDate),
    endDate: asString(project.endDate),
    links: Array.isArray(project.links)
      ? project.links.map((link) => ({ label: link.label, url: link.url }))
      : [],
    descriptionMarkdown: asString(project.descriptionMarkdown),
  };
};

const mapSkill = (skill) => ({
  label: asString(skill.attribute?.name),
  value: asString(skill.value),
});

export const buildSnapshotFromProfile = async (userId) => {
  const user = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName'] });
  const profile = await CandidateProfile.findOne({ where: { userId } });
  const skills = await CandidateSkills.findAll({
    where: { userId },
    include: [{ model: Attribute, as: 'attribute' }],
  });
  const education = await Education.findAll({
    where: { userId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  const projects = await Project.findAll({
    where: { userId },
    order: [
      ['displayOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  const contact = {
    name: composeName(user?.firstName, user?.lastName),
    headline: asString(profile?.headline),
    email: asString(profile?.publicEmail),
    phone: asString(profile?.phone),
    location: asString(profile?.location),
    links: profileLinks(profile),
  };

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
