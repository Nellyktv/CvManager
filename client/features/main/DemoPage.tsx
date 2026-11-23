import { useState } from 'react';
import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { candidates, positions } from '../../../server/demoFixtures';
import CvPreviewRouter from '../cv/preview/CvPreviewRouter';

const publicPositions = positions.filter((position) => !position.allowedEmails);

export default function DemoPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('Senior React Engineer');
  const [email, setEmail] = useState('');
  const position = publicPositions.find((item) => item.title === title)!;
  const samples = candidates.flatMap((candidate) =>
    candidate.cvs.filter((cv) => cv.position === title && cv.status === 'published')
      .map((cv) => ({ candidate, cv })),
  );
  const selected = samples.find(({ candidate }) => candidate.user.email === email) ?? samples[0];
  const candidate = selected?.candidate;

  return (
    <Stack gap={2} sx={{ m: 2 }}>
      <Typography variant="h4" component="h1">{t('dashboard.demoExamples')}</Typography>
      <TextField select label={t('dashboard.samplePosition')} value={title} onChange={(e) => {
        setTitle(e.target.value);
        setEmail('');
      }}>
        {publicPositions.map((item) => <MenuItem key={item.title} value={item.title}>{item.title}</MenuItem>)}
      </TextField>
      <Typography>{position.description}</Typography>
      {candidate && selected ? (
        <>
          <TextField select label={t('dashboard.sampleCv')} value={candidate.user.email} onChange={(e) => setEmail(e.target.value)}>
            {samples.map(({ candidate: { user } }) => (
              <MenuItem key={user.email} value={user.email}>{user.firstName} {user.lastName}</MenuItem>
            ))}
          </TextField>
          <CvPreviewRouter templateKey={selected.cv.templateKey} content={{
            contact: { name: [candidate.user.firstName, candidate.user.lastName].join(' '), email: candidate.user.email,
              headline: candidate.profile.headline, location: candidate.profile.location, links: [] },
            skills: Object.entries(candidate.skills).map(([label, value]) => ({ label, value })),
            education: candidate.education, projects: candidate.projects,
          }} />
        </>
      ) : <Typography>{t('dashboard.noSamples')}</Typography>}
    </Stack>
  );
}
