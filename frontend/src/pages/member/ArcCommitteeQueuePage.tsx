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
  Alert,
} from '@mui/material';
import { Assignment, ChevronRight } from '@mui/icons-material';
import { format } from 'date-fns';
import { useWorkflows } from '../../hooks/useWorkflows';
import WorkflowStatusBadge from '../../components/ARC/WorkflowStatusBadge';
import type { WorkflowStatus } from '../../types/api';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  arc_request: 'Architectural Review',
};

const statusFilters: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Needs Review', value: 'submitted' },
  { label: 'In Review', value: 'under_review' },
  { label: 'Appeals', value: 'appealed' },
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Review Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Requests from homeowners waiting for your committee's review. Click a row to see
          the full request and take action.
        </Typography>
      </Box>

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
            aria-pressed={statusFilter === f.value}
          />
        ))}
      </Box>

      {!isLoading && workflows.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {statusFilter ? 'No Matching Requests' : 'Queue is Empty'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            {statusFilter
              ? 'No requests match this filter. Try selecting a different status above.'
              : 'There are no requests waiting for review right now. Check back later.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Received</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : workflows.map((wf) => (
                    <TableRow
                      key={wf.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover .row-arrow': { opacity: 1 } }}
                      onClick={() => {
                        if (wf.request_type === 'arc_request') {
                          navigate(`/arc/${wf.request_id}`);
                        }
                      }}
                      role="link"
                      aria-label={`Review request #${wf.request_id} from ${wf.submitter?.name ?? 'unknown'}`}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          #{wf.request_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {REQUEST_TYPE_LABELS[wf.request_type] ?? wf.request_type}
                      </TableCell>
                      <TableCell>{wf.submitter?.name ?? '-'}</TableCell>
                      <TableCell>
                        <WorkflowStatusBadge status={wf.status as WorkflowStatus} />
                      </TableCell>
                      <TableCell>{format(new Date(wf.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <ChevronRight
                          className="row-arrow"
                          fontSize="small"
                          sx={{ opacity: 0.3, transition: 'opacity 0.15s' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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
      )}
    </Box>
  );
};

export default ArcCommitteeQueuePage;
