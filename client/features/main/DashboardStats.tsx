import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

type Stat = {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
};

type Props = {
  stats: Stat[];
};

const DashboardStats = ({ stats }: Props) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        gap: { xs: 1.5, sm: 2 },
        m: 1,
      }}
    >
      {stats.map((item) => (
        <Card
          key={item.label}
          sx={{
            '&:hover': { borderColor: item.color, transform: 'translateY(-2px)' },
            '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                  {item.label}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  color: item.color,
                  bgcolor: alpha(item.color, 0.12),
                }}
              >
                {item.icon}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default DashboardStats;
