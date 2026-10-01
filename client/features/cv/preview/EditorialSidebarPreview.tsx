import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvContent } from '../../../shared/types/cv';
import { formatCvDateRange } from '../../../shared/utils/formatDate';
import { isSafeUrl } from '../../../shared/utils/isSafeUrl';
import type { CvEditorSection } from '../CvPage.constants';
import { cvDocumentLocale } from './cvDocumentLocale';
import CvDocumentFrame from './CvDocumentFrame';
import { groupSkills } from './groupSkills';
import { renderMarkdown } from './renderMarkdown';

type EditorialSidebarPreviewProps = {
  content: CvContent;
  highlightedSection?: CvEditorSection;
};

const sectionHighlightProps = (
  section: CvEditorSection,
  highlightedSection: CvEditorSection | undefined,
  linkedLabel: string,
) => {
  const highlighted = highlightedSection === section;
  return {
    'data-testid': `cv-preview-${section}`,
    'data-highlighted': highlighted ? 'true' : undefined,
    'aria-description': highlighted ? linkedLabel : undefined,
  };
};

const sectionHeadingSx = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#d7e6ef',
  marginBottom: '0.55rem',
};

const mainHeadingSx = {
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: '#3d5a6c',
  borderBottom: '1px solid #c5d5e0',
  paddingBottom: '0.35rem',
  marginBottom: '0.85rem',
};

const EditorialSidebarPreview = ({
  content,
  highlightedSection,
}: EditorialSidebarPreviewProps) => {
  const { t, i18n } = useTranslation();
  const locale = cvDocumentLocale(i18n.language);
  const linkedLabel = t('cv.sectionPreviewLinked');
  const { contact, skills, education, projects } = content;
  const skillBuckets = groupSkills(skills);

  return (
    <CvDocumentFrame>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '32% 1fr',
          minHeight: '100%',
          fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
        }}
      >
        <Box
          component="aside"
          sx={{
            bgcolor: '#1f3a4c',
            color: '#f4f8fb',
            minWidth: 0,
            overflowWrap: 'break-word',
            px: 2.25,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <Box
            component="section"
            aria-labelledby="cv-contact-heading"
            {...sectionHighlightProps('contact', highlightedSection, linkedLabel)}
          >
            <Typography
              id="cv-contact-heading"
              component="h2"
              sx={sectionHeadingSx}
            >
              {t('cv.documentContact')}
            </Typography>
            {contact.email ? (
              <Typography sx={{ fontSize: '0.82rem', mb: 0.5 }}>{contact.email}</Typography>
            ) : null}
            {contact.phone ? (
              <Typography sx={{ fontSize: '0.82rem', mb: 0.5 }}>{contact.phone}</Typography>
            ) : null}
            {contact.location ? (
              <Typography sx={{ fontSize: '0.82rem', mb: 0.75 }}>{contact.location}</Typography>
            ) : null}
            {contact.links.length > 0 ? (
              <Box component="ul" sx={{ m: 0, pl: 1.5, listStyle: 'disc' }}>
                {contact.links.map((link) => (
                  <Box component="li" key={link.url} sx={{ mb: 0.35, fontSize: '0.8rem' }}>
                    {isSafeUrl(link.url) ? (
                      <Box
                        component="a"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#9ed0ea', textDecoration: 'none' }}
                      >
                        {link.label}
                      </Box>
                    ) : (
                      link.label
                    )}
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>

          <Box
            component="section"
            aria-labelledby="cv-skills-heading"
            {...sectionHighlightProps('skills', highlightedSection, linkedLabel)}
          >
            <Typography id="cv-skills-heading" component="h2" sx={sectionHeadingSx}>
              {t('cv.documentSkills')}
            </Typography>
            {skillBuckets.map((bucket) => (
              <Box key={bucket.group || '__ungrouped'} sx={{ mb: bucket.group ? 1 : 0 }}>
                {bucket.group ? (
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 0.35, opacity: 0.95 }}>
                    {bucket.group}
                  </Typography>
                ) : null}
                <Box component="ul" sx={{ m: 0, pl: 1.5 }}>
                  {bucket.skills.map((skill) => (
                    <Box component="li" key={skill.label} sx={{ mb: 0.4, fontSize: '0.82rem' }}>
                      {skill.label}
                      {skill.value ? ` — ${skill.value}` : ''}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Box
            component="section"
            aria-labelledby="cv-education-heading"
            {...sectionHighlightProps('education', highlightedSection, linkedLabel)}
          >
            <Typography id="cv-education-heading" component="h2" sx={sectionHeadingSx}>
              {t('cv.documentEducation')}
            </Typography>
            {education.map((entry) => {
              const dates = formatCvDateRange(entry.startDate, entry.endDate, locale);
              return (
                <Box key={`${entry.institution}-${entry.startDate || ''}`} sx={{ mb: 1.25 }}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {entry.institution}
                  </Typography>
                  {[entry.degree, entry.field].filter(Boolean).length > 0 ? (
                    <Typography sx={{ fontSize: '0.78rem', opacity: 0.9 }}>
                      {[entry.degree, entry.field].filter(Boolean).join(', ')}
                    </Typography>
                  ) : null}
                  {entry.location ? (
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>
                      {entry.location}
                    </Typography>
                  ) : null}
                  {dates ? (
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>{dates}</Typography>
                  ) : null}
                  {entry.description ? (
                    <Typography sx={{ fontSize: '0.75rem', mt: 0.35, opacity: 0.9 }}>
                      {entry.description}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ px: 3, py: 3.25, bgcolor: '#ffffff', color: '#1a1a1a' }}>
          <Box component="header" sx={{ mb: 2.5 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: '1.85rem',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#152937',
              }}
            >
              {contact.name}
            </Typography>
            {contact.headline ? (
              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: '1rem',
                  color: '#3d5a6c',
                  fontWeight: 500,
                }}
              >
                {contact.headline}
              </Typography>
            ) : null}
          </Box>

          <Box
            component="section"
            aria-labelledby="cv-projects-heading"
            {...sectionHighlightProps('projects', highlightedSection, linkedLabel)}
          >
            <Typography id="cv-projects-heading" component="h2" sx={mainHeadingSx}>
              {t('cv.documentProjects')}
            </Typography>
            {projects.map((project) => {
              const dates = formatCvDateRange(project.startDate, project.endDate, locale);
              return (
                <Box
                  key={`${project.title}-${project.startDate || ''}`}
                  component="article"
                  sx={{ mb: 2.25 }}
                >
                  <Typography
                    component="h3"
                    sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#152937' }}
                  >
                    {project.title}
                  </Typography>
                  {(project.role || dates) && (
                    <Typography sx={{ fontSize: '0.84rem', color: '#4a6070', mb: 0.5 }}>
                      {[project.role, dates].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                  {project.links.length > 0 ? (
                    <Box
                      component="ul"
                      sx={{ m: '0 0 0.5rem', pl: 1.5, fontSize: '0.82rem' }}
                    >
                      {project.links.map((link) => (
                        <Box component="li" key={link.url}>
                          {isSafeUrl(link.url) ? (
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.label}
                            </a>
                          ) : (
                            link.label
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : null}
                  <Box sx={{ fontSize: '0.88rem', color: '#243443' }}>
                    {renderMarkdown(project.descriptionMarkdown)}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </CvDocumentFrame>
  );
};

export default EditorialSidebarPreview;
