import { List, ListItemButton, ListItemText } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { CvContent } from '../../../shared/types/cv';
import {
  CV_EDITOR_SECTIONS,
  type CvEditorSection,
} from '../CvPage.constants';

type Props = {
  value: CvEditorSection;
  onChange: (next: CvEditorSection) => void;
  content: CvContent;
  orientation?: 'vertical' | 'horizontal';
};

const SECTION_LABEL_KEYS = {
  contact: 'cv.sectionContact',
  skills: 'cv.sectionSkills',
  education: 'cv.sectionEducation',
  projects: 'cv.sectionProjects',
} as const;

const isContactComplete = (content: CvContent) =>
  Boolean(content.contact.name.trim() && content.contact.email?.trim());

const hasNonblankInstitution = (content: CvContent) =>
  content.education.some((entry) => entry.institution.trim().length > 0);

type SectionMeta = {
  count: number | null;
  complete: boolean;
};

const sectionMeta = (section: CvEditorSection, content: CvContent): SectionMeta => {
  switch (section) {
    case 'contact':
      return { count: null, complete: isContactComplete(content) };
    case 'skills':
      return { count: content.skills.length, complete: content.skills.length > 0 };
    case 'education':
      return {
        count: content.education.length,
        complete: hasNonblankInstitution(content),
      };
    case 'projects':
      return { count: content.projects.length, complete: content.projects.length > 0 };
  }
};

const CvSectionRail = ({
  value,
  onChange,
  content,
  orientation = 'vertical',
}: Props) => {
  const { t } = useTranslation();
  const horizontal = orientation === 'horizontal';

  return (
    <List
      component="nav"
      aria-label={t('cv.sectionRailLabel')}
      dense
      disablePadding
      sx={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        overflowX: horizontal ? 'auto' : undefined,
        gap: horizontal ? 0.5 : 0,
      }}
    >
      {CV_EDITOR_SECTIONS.map((section) => {
        const selected = value === section;
        const label = t(SECTION_LABEL_KEYS[section]);
        const { count, complete } = sectionMeta(section, content);
        const completionLabel = complete
          ? t('cv.sectionComplete')
          : t('cv.sectionIncomplete');
        const countLabel =
          count === null ? null : t('cv.sectionItemCount', { count });
        const secondary = [countLabel, completionLabel].filter(Boolean).join(', ');
        const accessibleName = [label, countLabel, completionLabel]
          .filter(Boolean)
          .join(', ');

        return (
          <ListItemButton
            key={section}
            selected={selected}
            aria-current={selected ? 'step' : undefined}
            aria-label={accessibleName}
            onClick={() => onChange(section)}
            sx={{
              borderRadius: '8px',
              flex: horizontal ? '0 0 auto' : undefined,
              minWidth: horizontal ? 'fit-content' : undefined,
              py: 0.75,
            }}
          >
            <ListItemText
              primary={label}
              secondary={secondary}
              slotProps={{
                primary: { variant: 'body2' },
                secondary: { variant: 'caption' },
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
};

export default CvSectionRail;
