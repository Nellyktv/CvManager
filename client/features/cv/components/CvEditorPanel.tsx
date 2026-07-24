import { Box, Stack } from '@mui/material';

import type { CvContent } from '../../../shared/types/cv';
import type { CvEditorSection } from '../CvPage.constants';
import CvContactSectionEditor from './sections/CvContactSectionEditor';
import CvEducationSectionEditor from './sections/CvEducationSectionEditor';
import CvProjectsSectionEditor from './sections/CvProjectsSectionEditor';
import CvSkillsSectionEditor from './sections/CvSkillsSectionEditor';

type Props = {
  content: CvContent;
  onChange: (next: CvContent) => void;
  activeSection?: CvEditorSection;
  disabled?: boolean;
};

const sectionTestId = (section: CvEditorSection) => `cv-editor-section-${section}`;

const CvEditorPanel = ({
  content,
  onChange,
  activeSection = 'contact',
  disabled = false,
}: Props) => (
  <Stack gap={3} sx={{ p: 1 }}>
    <Box
      data-testid={sectionTestId('contact')}
      hidden={activeSection !== 'contact'}
    >
      <CvContactSectionEditor
        contact={content.contact}
        onChange={(contact) => onChange({ ...content, contact })}
        disabled={disabled}
      />
    </Box>
    <Box
      data-testid={sectionTestId('skills')}
      hidden={activeSection !== 'skills'}
    >
      <CvSkillsSectionEditor
        skills={content.skills}
        onChange={(skills) => onChange({ ...content, skills })}
        disabled={disabled}
      />
    </Box>
    <Box
      data-testid={sectionTestId('education')}
      hidden={activeSection !== 'education'}
    >
      <CvEducationSectionEditor
        education={content.education}
        onChange={(education) => onChange({ ...content, education })}
        disabled={disabled}
      />
    </Box>
    <Box
      data-testid={sectionTestId('projects')}
      hidden={activeSection !== 'projects'}
    >
      <CvProjectsSectionEditor
        projects={content.projects}
        onChange={(projects) => onChange({ ...content, projects })}
        disabled={disabled}
      />
    </Box>
  </Stack>
);

export default CvEditorPanel;
