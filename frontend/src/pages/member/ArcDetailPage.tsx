import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Breadcrumbs,
  Link,
  Skeleton,
  Divider,
  Alert,
  Button,
} from '@mui/material';
import {
  Home,
  Category,
  Person,
  CalendarToday,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useArcRequest } from '../../hooks/useArcRequests';
import { useWorkflow } from '../../hooks/useWorkflows';
import WorkflowStatusBadge from '../../components/ARC/WorkflowStatusBadge';
import WorkflowTimeline from '../../components/ARC/WorkflowTimeline';
import CommentThread from '../../components/ARC/CommentThread';
import FileAttachments from '../../components/ARC/FileAttachments';
import TransitionActions from '../../components/ARC/TransitionActions';

const DetailField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
    <Box sx={{ color: 'action.active', mt: 0.25 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
    </Box>
  </Box>
);

const ArcDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const arcRequestId = Number(id);
  const { arcRequest, detailWorkflow, isLoading: isLoadingRequest } = useArcRequest(arcRequestId);
  const workflowId = detailWorkflow?.id ?? arcRequest?.workflow?.id ?? 0;
  const { workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId, workflowId > 0);

  const isLoading = isLoadingRequest || (workflowId > 0 && isLoadingWorkflow);
  const isSubmitter = user?.id === arcRequest?.submitter_id;
  const isCommitteeMember =
    workflow?.committee?.members?.some((m) => m.user_id === user?.id) ?? false;

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={200} height={24} sx={{ mb: 1 }} />
        <Skeleton width={350} height={36} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!arcRequest) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Request Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This request may have been removed or you may not have permission to view it.
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/arc')}>
          Back to My Requests
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/arc')}>
          My Requests
        </Link>
        <Typography variant="body2" color="text.primary">
          Request #{arcRequest.id}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5">
          {arcRequest.category?.name ?? 'Review'} Request
        </Typography>
        {workflow && <WorkflowStatusBadge status={workflow.status} size="medium" />}
        <Typography variant="body2" color="text.secondary">
          #{arcRequest.id}
        </Typography>
      </Box>

      {/* Actions bar - only show if there are available actions */}
      {workflow && (isSubmitter || isCommitteeMember) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Actions:
          </Typography>
          <TransitionActions
            workflow={workflow}
            isSubmitter={isSubmitter}
            isCommitteeMember={isCommitteeMember}
          />
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Request info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <DetailField icon={<Home fontSize="small" />} label="Property Address" value={arcRequest.property_address} />
              <DetailField icon={<Category fontSize="small" />} label="Category" value={arcRequest.category?.name ?? '-'} />
              <DetailField icon={<Person fontSize="small" />} label="Submitted By" value={arcRequest.submitter?.name ?? '-'} />
              <DetailField icon={<CalendarToday fontSize="small" />} label="Submitted" value={arcRequest.created_at ? format(new Date(arcRequest.created_at), 'MMMM d, yyyy') : '-'} />
              {workflow?.expires_at && (
                <DetailField icon={<Schedule fontSize="small" />} label="Approval Expires" value={format(new Date(workflow.expires_at), 'MMMM d, yyyy')} />
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Description</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
              {arcRequest.description}
            </Typography>
          </Paper>

          {/* Comments */}
          {workflow && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Discussion
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use comments to ask questions or provide additional information to the review committee.
              </Typography>
              <CommentThread
                comments={workflow.comments ?? []}
                isCommitteeMember={isCommitteeMember}
                workflowId={workflow.id}
              />
            </Paper>
          )}

          {/* Attachments */}
          {workflow && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Supporting Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload photos, plans, material samples, or any documents that help the committee review your request.
              </Typography>
              <FileAttachments
                attachments={workflow.attachments ?? []}
                workflowId={workflow.id}
                canUpload={isSubmitter || isCommitteeMember}
              />
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {workflow && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Status History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <WorkflowTimeline transitions={workflow.transitions ?? []} />
            </Paper>
          )}

          {isSubmitter && (
            <Alert severity="info" variant="outlined">
              <Typography variant="body2">
                You'll be notified by email when the committee takes action on your request.
              </Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArcDetailPage;
