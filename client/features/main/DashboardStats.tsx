import { Card, CardContent, Stack, Typography } from '@mui/material';

type Stat = {
  value: number;
  label: string;
};

type Props = {
  stats: Stat[];
};

const DashboardStats = ({ stats }: Props) => {
  return (
    <Stack direction="row" gap={2} sx={{ m: 1 }} flexWrap="wrap">
      {stats.map((item) => (
        <Card key={item.label} sx={{ minWidth: 200, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4">{item.value}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default DashboardStats;
