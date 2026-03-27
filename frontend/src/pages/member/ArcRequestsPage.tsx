import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { useArcRequests } from '../../hooks/useArcRequests';
import WorkflowStatusBadge from '../../components/ARC/WorkflowStatusBadge';

const ArcRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { arcRequests, pagination, isLoading } = useArcRequests({
    page: page + 1,
    limit: rowsPerPage,
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Architectural Review Requests</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/arc/submit')}>
          Submit New Request
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Property Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : arcRequests.map((req) => (
                  <TableRow
                    key={req.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/arc/${req.id}`)}
                  >
                    <TableCell>{req.id}</TableCell>
                    <TableCell>{req.category?.name ?? '-'}</TableCell>
                    <TableCell>{req.property_address}</TableCell>
                    <TableCell>
                      {req.workflow ? (
                        <WorkflowStatusBadge status={req.workflow.status} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(req.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
            {!isLoading && arcRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No requests found. Submit your first architectural review request.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination?.total ?? 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default ArcRequestsPage;
