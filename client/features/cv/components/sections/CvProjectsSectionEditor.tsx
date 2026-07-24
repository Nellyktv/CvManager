import { useState } from 'react';
import { Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTranslation } from 'react-i18next';

import type { CvLink, CvProject } from '../../../../shared/types/cv';
import { cvLinkSchema } from '../../../../shared/utils/cvSchemas';
import { moveItem } from '../../../../shared/utils/moveItem';
import MarkdownProjectEditor from '../MarkdownProjectEditor';

type Props = {
  projects: CvProject[];
  onChange: (projects: CvProject[]) => void;
  disabled?: boolean;
};

const emptyProject = (): CvProject => ({
  title: '',
  links: [],
  descriptionMarkdown: '',
});

const emptyDraft = (): CvLink => ({ label: '', url: '' });

const CvProjectsSectionEditor = ({
  projects,
  onChange,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const [draftLinks, setDraftLinks] = useState<Record<number, CvLink | undefined>>({});

  const updateProject = (index: number, patch: Partial<CvProject>) => {
    onChange(projects.map((project, i) => (i === index ? { ...project, ...patch } : project)));
  };

  const updateLink = (projectIndex: number, linkIndex: number, key: keyof CvLink, value: string) => {
    const project = projects[projectIndex];
    const links = project.links.map((link, i) =>
      i === linkIndex ? { ...link, [key]: value } : link,
    );
    updateProject(projectIndex, { links });
  };

  const addLink = (projectIndex: number) => {
    if (disabled || draftLinks[projectIndex]) return;
    setDraftLinks((prev) => ({ ...prev, [projectIndex]: emptyDraft() }));
  };

  const updateDraft = (projectIndex: number, key: keyof CvLink, value: string) => {
    setDraftLinks((prev) => {
      const draft = prev[projectIndex];
      if (!draft) return prev;
      return { ...prev, [projectIndex]: { ...draft, [key]: value } };
    });
  };

  const commitDraft = (projectIndex: number) => {
    const draft = draftLinks[projectIndex];
    if (!draft || !cvLinkSchema.safeParse(draft).success) return;
    const project = projects[projectIndex];
    updateProject(projectIndex, { links: [...project.links, draft] });
    setDraftLinks((prev) => {
      const next = { ...prev };
      delete next[projectIndex];
      return next;
    });
  };

  const cancelDraft = (projectIndex: number) => {
    setDraftLinks((prev) => {
      const next = { ...prev };
      delete next[projectIndex];
      return next;
    });
  };

  const removeLink = (projectIndex: number, linkIndex: number) => {
    const project = projects[projectIndex];
    updateProject(projectIndex, {
      links: project.links.filter((_, i) => i !== linkIndex),
    });
  };

  const addProject = () => {
    onChange([...projects, emptyProject()]);
  };

  const removeProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
    setDraftLinks((prev) => {
      const next: Record<number, CvLink | undefined> = {};
      for (const [key, value] of Object.entries(prev)) {
        const from = Number(key);
        if (from === index || value === undefined) continue;
        next[from > index ? from - 1 : from] = value;
      }
      return next;
    });
  };

  return (
    <Stack gap={2}>
      <Typography variant="h6">{t('cv.documentProjects')}</Typography>

      {projects.map((project, index) => (
        <Stack
          key={index}
          gap={1.5}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">
              {project.title || t('cv.addProject')}
            </Typography>
            <Stack direction="row">
              <IconButton
                aria-label={t('cv.moveUp')}
                onClick={() => onChange(moveItem(projects, index, -1))}
                disabled={disabled || index === 0}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                aria-label={t('cv.moveDown')}
                onClick={() => onChange(moveItem(projects, index, 1))}
                disabled={disabled || index === projects.length - 1}
              >
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton
                aria-label={t('cv.removeItem')}
                onClick={() => removeProject(index)}
                disabled={disabled}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>

          <TextField
            label={t('profile.projectTitle')}
            value={project.title}
            onChange={(e) => updateProject(index, { title: e.target.value })}
            disabled={disabled}
            required
          />
          <TextField
            label={t('profile.projectRole')}
            value={project.role ?? ''}
            onChange={(e) => updateProject(index, { role: e.target.value })}
            disabled={disabled}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
            <TextField
              label={t('profile.projectStartDate')}
              type="date"
              value={project.startDate ?? ''}
              onChange={(e) => updateProject(index, { startDate: e.target.value })}
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label={t('profile.projectEndDate')}
              type="date"
              value={project.endDate ?? ''}
              onChange={(e) => updateProject(index, { endDate: e.target.value })}
              disabled={disabled}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>

          {project.links.map((link, linkIndex) => (
            <Stack key={linkIndex} direction="row" gap={1} alignItems="flex-start">
              <TextField
                label={t('profile.projectLinkLabel')}
                value={link.label}
                onChange={(e) => updateLink(index, linkIndex, 'label', e.target.value)}
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('profile.projectLinkUrl')}
                value={link.url}
                onChange={(e) => updateLink(index, linkIndex, 'url', e.target.value)}
                disabled={disabled}
                fullWidth
              />
              <IconButton
                aria-label={t('cv.removeItem')}
                onClick={() => removeLink(index, linkIndex)}
                disabled={disabled}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          ))}

          {draftLinks[index] && (
            <Stack direction="row" gap={1} alignItems="flex-start">
              <TextField
                label={t('profile.projectLinkLabel')}
                value={draftLinks[index]!.label}
                onChange={(e) => updateDraft(index, 'label', e.target.value)}
                onBlur={() => commitDraft(index)}
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('profile.projectLinkUrl')}
                value={draftLinks[index]!.url}
                onChange={(e) => updateDraft(index, 'url', e.target.value)}
                onBlur={() => commitDraft(index)}
                disabled={disabled}
                fullWidth
              />
              <IconButton
                aria-label={t('cv.removeItem')}
                onClick={() => cancelDraft(index)}
                disabled={disabled}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          )}

          <Button
            onClick={() => addLink(index)}
            disabled={disabled || Boolean(draftLinks[index])}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('profile.addProjectLink')}
          </Button>

          {!disabled && (
            <MarkdownProjectEditor
              value={project.descriptionMarkdown ?? ''}
              onChange={(value) => updateProject(index, { descriptionMarkdown: value })}
            />
          )}
          {disabled && project.descriptionMarkdown ? (
            <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
              {project.descriptionMarkdown}
            </Typography>
          ) : null}
        </Stack>
      ))}

      <Button onClick={addProject} disabled={disabled} sx={{ alignSelf: 'flex-start' }}>
        {t('cv.addProject')}
      </Button>
    </Stack>
  );
};

export default CvProjectsSectionEditor;
