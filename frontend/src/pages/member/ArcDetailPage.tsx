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
} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useArcRequest } from '../../hooks/useArcRequests';
import { useWorkflow } from '../../hooks/useWorkflows';
import WorkflowStatusBadge from '../../components/ARC/WorkflowStatusBadge';
import WorkflowTimeline from '../../components/ARC/WorkflowTimeline';
import CommentThread from '../../components/ARC/CommentThread';
import FileAttachments from '../../components/ARC/FileAttachments';
import TransitionActions from '../../components/ARC/TransitionActions';

const ArcDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const arcRequestId = Number(id);
  const { arcRequest, isLoading: isLoadingRequest } = useArcRequest(arcRequestId);
  const workflowId = arcRequest?.workflow?.id ?? 0;
  const { workflow, isLoading: isLoadingWorkflow } = useWorkflow(workflowId, workflowId > 0);

  const isLoading = isLoadingRequest || (workflowId > 0 && isLoadingWorkflow);
  const isSubmitter = user?.id === arcRequest?.submitter_id;
  const isCommitteeMember =
    workflow?.committee?.members?.some((m) => m.user_id === user?.id) ?? false;

  if (isLoading) {
    return (
      <Box>
        <Skeleton width={300} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={150} />
      </Box>
    );
  }

  if (!arcRequest) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Request not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/arc')}>
          ARC Requests
        </Link>
        <Typography variant="body2" color="text.primary">
          Request #{arcRequest.id}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5">
          ARC Request #{arcRequest.id}
        </Typography>
        {workflow && <WorkflowStatusBadge status={workflow.status} size="medium" />}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">{arcRequest.category?.name ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Property Address
                </Typography>
                <Typography variant="body1">{arcRequest.property_address}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Submitter
                </Typography>
                <Typography variant="body1">{arcRequest.submitter?.name ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Submitted
                </Typography>
                <Typography variant="body1">
                  {format(new Date(arcRequest.created_at), 'MMMM d, yyyy')}
                </Typography>
              </Grid>
              {workflow?.expires_at && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(workflow.expires_at), 'MMMM d, yyyy')}
                  </Typography>
                </Grid>
              )}
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {arcRequest.description}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {workflow && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <TransitionActions
                  workflow={workflow}
                  isSubmitter={isSubmitter}
                  isCommitteeMember={isCommitteeMember}
                />
              </Paper>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Comments
                </Typography>
                <CommentThread
                  comments={workflow.comments ?? []}
                  isCommitteeMember={isCommitteeMember}
                  workflowId={workflow.id}
                />
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Attachments
                </Typography>
                <FileAttachments
                  attachments={workflow.attachments ?? []}
                  workflowId={workflow.id}
                  canUpload={isSubmitter || isCommitteeMember}
                />
              </Paper>
            </>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {workflow && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <WorkflowTimeline transitions={workflow.transitions ?? []} />
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArcDetailPage;
