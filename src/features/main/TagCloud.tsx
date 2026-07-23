import { Chip, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Tag } from './MainPage.constants';

type Props = {
  tags: Tag[];
  onTagClick: (name: string) => void;
};

const TagCloud = ({ tags, onTagClick }: Props) => {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, m: 1, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('dashboard.tagCloud')}
      </Typography>

      <Stack direction="row" gap={1} flexWrap="wrap">
        {tags.length === 0 ? (
          <Typography color="text.secondary">
            {t('dashboard.noTagsYet')}
          </Typography>
        ) : (
          tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              onClick={() => onTagClick(tag.name)}
            />
          ))
        )}
      </Stack>
    </Paper>
  );
};

export default TagCloud;
