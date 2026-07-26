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

type StructuredMinimalPreviewProps = {
  content: CvContent;
  highlightedSection?: CvEditorSection;
};

const sectionHighlightProps = (
  section: CvEditorSection,
  highlightedSection: CvEditorSection | undefined,
  linkedLabel: string,
  surface?: 'dark',
) => {
  const highlighted = highlightedSection === section;
  return {
    'data-testid': `cv-preview-${section}`,
    'data-highlighted': highlighted ? 'true' : undefined,
    'data-highlight-surface': surface,
    'aria-description': highlighted ? linkedLabel : undefined,
  };
};

const railHeadingSx = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  color: '#5a6570',
  borderBottom: '1px solid #cfd5db',
  paddingBottom: '0.3rem',
  marginBottom: '0.7rem',
};

const StructuredMinimalPreview = ({
  content,
  highlightedSection,
}: StructuredMinimalPreviewProps) => {
  const { t, i18n } = useTranslation();
  const locale = cvDocumentLocale(i18n.language);
  const linkedLabel = t('cv.sectionPreviewLinked');
  const { contact, skills, education, projects } = content;
  const skillBuckets = groupSkills(skills);

  const contactBits = [
    contact.email,
    contact.phone,
    contact.location,
    ...contact.links.map((link) => link.label),
  ].filter(Boolean);

  return (
    <CvDocumentFrame>
      <Box
        sx={{
          minHeight: '100%',
          fontFamily: '"Source Serif 4", "Georgia", serif',
          bgcolor: '#ffffff',
          color: '#1c1f24',
        }}
      >
        <Box
          component="header"
          sx={{
            bgcolor: '#334155',
            color: '#f8fafc',
            px: 3,
            py: 2.5,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
            }}
          >
            {contact.name}
          </Typography>
          {contact.headline ? (
            <Typography
              sx={{
                mt: 0.4,
                fontSize: '0.95rem',
                opacity: 0.92,
                fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
              }}
            >
              {contact.headline}
            </Typography>
          ) : null}

          <Box
            component="section"
            aria-labelledby="cv-contact-heading"
            sx={{ mt: 1.25 }}
            {...sectionHighlightProps('contact', highlightedSection, linkedLabel, 'dark')}
          >
            <Typography
              id="cv-contact-heading"
              component="h2"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.8,
                mb: 0.35,
                fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
              }}
            >
              {t('cv.documentContact')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.82rem',
                fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
                lineHeight: 1.45,
              }}
            >
              {contactBits.map((bit, index) => {
                const link = contact.links.find((item) => item.label === bit);
                return (
                  <Box component="span" key={`${bit}-${index}`}>
                    {index > 0 ? (
                      <Box component="span" sx={{ mx: 0.75, opacity: 0.55 }}>
                        ·
                      </Box>
                    ) : null}
                    {link && isSafeUrl(link.url) ? (
                      <Box
                        component="a"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#cbd5e1', textDecoration: 'underline' }}
                      >
                        {link.label}
                      </Box>
                    ) : (
                      bit
                    )}
                  </Box>
                );
              })}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr',
            gap: 3,
            px: 3,
            py: 2.75,
            fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
          }}
        >
          <Box
            component="section"
            aria-labelledby="cv-projects-heading"
            {...sectionHighlightProps('projects', highlightedSection, linkedLabel)}
          >
            <Typography id="cv-projects-heading" component="h2" sx={railHeadingSx}>
              {t('cv.documentProjects')}
            </Typography>
            {projects.map((project) => {
              const dates = formatCvDateRange(project.startDate, project.endDate, locale);
              return (
                <Box
                  key={`${project.title}-${project.startDate ?? ''}`}
                  component="article"
                  sx={{
                    mb: 2,
                    pb: 1.5,
                    borderBottom: '1px solid #e5e7eb',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography component="h3" sx={{ fontSize: '1.02rem', fontWeight: 600 }}>
                    {project.title}
                  </Typography>
                  {(project.role || dates) && (
                    <Typography sx={{ fontSize: '0.82rem', color: '#4b5563', mb: 0.45 }}>
                      {[project.role, dates].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                  {project.links.length > 0 ? (
                    <Box component="ul" sx={{ m: '0 0 0.45rem', pl: 1.5, fontSize: '0.8rem' }}>
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
                  <Box sx={{ fontSize: '0.86rem', color: '#1f2937' }}>
                    {renderMarkdown(project.descriptionMarkdown)}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
            <Box
              component="section"
              aria-labelledby="cv-skills-heading"
              {...sectionHighlightProps('skills', highlightedSection, linkedLabel)}
            >
              <Typography id="cv-skills-heading" component="h2" sx={railHeadingSx}>
                {t('cv.documentSkills')}
              </Typography>
              {skillBuckets.map((bucket) => (
                <Box key={bucket.group ?? '__ungrouped'} sx={{ mb: bucket.group ? 1 : 0 }}>
                  {bucket.group ? (
                    <Typography
                      sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.3, color: '#374151' }}
                    >
                      {bucket.group}
                    </Typography>
                  ) : null}
                  <Box component="ul" sx={{ m: 0, pl: 1.5 }}>
                    {bucket.skills.map((skill) => (
                      <Box component="li" key={skill.label} sx={{ mb: 0.35, fontSize: '0.84rem' }}>
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
              <Typography id="cv-education-heading" component="h2" sx={railHeadingSx}>
                {t('cv.documentEducation')}
              </Typography>
              {education.map((entry) => {
                const dates = formatCvDateRange(entry.startDate, entry.endDate, locale);
                return (
                  <Box key={`${entry.institution}-${entry.startDate ?? ''}`} sx={{ mb: 1.1 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {entry.institution}
                    </Typography>
                    {[entry.degree, entry.field].filter(Boolean).length > 0 ? (
                      <Typography sx={{ fontSize: '0.8rem', color: '#4b5563' }}>
                        {[entry.degree, entry.field].filter(Boolean).join(', ')}
                      </Typography>
                    ) : null}
                    {entry.location ? (
                      <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {entry.location}
                      </Typography>
                    ) : null}
                    {dates ? (
                      <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {dates}
                      </Typography>
                    ) : null}
                    {entry.description ? (
                      <Typography sx={{ fontSize: '0.78rem', mt: 0.3, color: '#374151' }}>
                        {entry.description}
                      </Typography>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </CvDocumentFrame>
  );
};

export default StructuredMinimalPreview;
