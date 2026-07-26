import { useId } from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { useThemeStore } from '../../../store/ThemeStore';
import { renderMarkdown } from '../preview/renderMarkdown';
import '@uiw/react-md-editor/markdown-editor.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

const MarkdownProjectEditor = ({ value, onChange, label }: Props) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const labelId = useId();
  const editorId = useId();
  const resolvedLabel = label || t('profile.descriptionMarkdown');

  const toolbarCommands = [
    {
      ...commands.bold,
      buttonProps: { 'aria-label': t('profile.markdownBold') },
    },
    {
      ...commands.italic,
      buttonProps: { 'aria-label': t('profile.markdownItalic') },
    },
    {
      ...commands.unorderedListCommand,
      buttonProps: { 'aria-label': t('profile.markdownUnorderedList') },
    },
    {
      ...commands.link,
      buttonProps: { 'aria-label': t('profile.markdownLink') },
    },
  ];

  return (
    <Stack gap={1}>
      <Typography variant="body2" component="label" htmlFor={editorId} id={labelId}>
        {resolvedLabel}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t('profile.markdownHint')}
      </Typography>
      <div data-color-mode={theme}>
        <MDEditor
          value={value}
          onChange={(next) => onChange(next ?? '')}
          commands={toolbarCommands}
          extraCommands={[]}
          data-color-mode={theme}
          preview="live"
          height={220}
          components={{
            preview: (source) => (
              <div className="cv-md-safe-preview" style={{ padding: 16 }}>
                {renderMarkdown(source)}
              </div>
            ),
          }}
          textareaProps={{
            id: editorId,
            'aria-labelledby': labelId,
          }}
        />
      </div>
    </Stack>
  );
};

export default MarkdownProjectEditor;
