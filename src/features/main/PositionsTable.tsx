import { Box, Paper, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import type { PositionRow } from './MainPage.constants';

type Props = {
  title: string;
  rows: PositionRow[];
  columns: GridColDef[];
};

const PositionsTable = ({ title, rows, columns }: Props) => {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, flexGrow: 1, minWidth: 320 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Box sx={{ height: 400 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </Paper>
  );
};

export default PositionsTable;
