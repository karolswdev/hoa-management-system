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
  Tooltip,
} from '@mui/material';
import { Add, Architecture, ChevronRight } from '@mui/icons-material';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            My Review Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track the status of your architectural change requests. Each request is reviewed
            by the committee before work can begin.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/arc/submit')}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          New Request
        </Button>
      </Box>

      {!isLoading && arcRequests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Architecture sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Requests Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
            Planning a change to your home's exterior? Submit a request and the review
            committee will get back to you, usually within a few business days.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/arc/submit')}>
            Submit Your First Request
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Property</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell sx={{ width: 48 }}>
                <Typography sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                  Details
                </Typography>
              </TableCell>
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
                : arcRequests.map((req) => (
                    <TableRow
                      key={req.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover .row-arrow': { opacity: 1 } }}
                      onClick={() => navigate(`/arc/${req.id}`)}
                      role="link"
                      aria-label={`View request #${req.id} for ${req.property_address}`}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          #{req.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{req.category?.name ?? '-'}</TableCell>
                      <TableCell>
                        <Tooltip title={req.property_address}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                            {req.property_address}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {req.workflow ? (
                          <WorkflowStatusBadge status={req.workflow.status} />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : '-'}</TableCell>
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

export default ArcRequestsPage;
