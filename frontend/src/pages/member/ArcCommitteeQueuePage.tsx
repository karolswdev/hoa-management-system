import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
} from '@mui/material';
import { format } from 'date-fns';
import { useWorkflows } from '../../hooks/useWorkflows';
import WorkflowStatusBadge from '../../components/ARC/WorkflowStatusBadge';
import type { WorkflowStatus } from '../../types/api';

const statusFilters: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Appealed', value: 'appealed' },
  { label: 'Appeal Under Review', value: 'appeal_under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
];

const ArcCommitteeQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { workflows, pagination, isLoading } = useWorkflows({
    status: statusFilter,
    page: page + 1,
    limit: rowsPerPage,
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Committee Review Queue
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {statusFilters.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            variant={statusFilter === f.value ? 'filled' : 'outlined'}
            color={statusFilter === f.value ? 'primary' : 'default'}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(0);
            }}
          />
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Request Type</TableCell>
              <TableCell>Submitter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
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
              : workflows.map((wf) => (
                  <TableRow
                    key={wf.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (wf.request_type === 'arc_request') {
                        navigate(`/arc/${wf.request_id}`);
                      }
                    }}
                  >
                    <TableCell>{wf.id}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {wf.request_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>{wf.submitter?.name ?? '-'}</TableCell>
                    <TableCell>
                      <WorkflowStatusBadge status={wf.status as WorkflowStatus} />
                    </TableCell>
                    <TableCell>{format(new Date(wf.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
            {!isLoading && workflows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No workflows found.
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

export default ArcCommitteeQueuePage;
