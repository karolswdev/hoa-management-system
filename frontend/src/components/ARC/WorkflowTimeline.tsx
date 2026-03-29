import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { format } from 'date-fns';
import type { WorkflowTransition } from '../../types/api';
import WorkflowStatusBadge from './WorkflowStatusBadge';

interface WorkflowTimelineProps {
  transitions: WorkflowTransition[];
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ transitions }) => {
  if (!transitions.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No transitions yet.
      </Typography>
    );
  }

  const getDate = (t: WorkflowTransition) => (t as any).performed_at ?? (t as any).created_at;
  const sorted = [...transitions].sort(
    (a, b) => new Date(getDate(a) ?? 0).getTime() - new Date(getDate(b) ?? 0).getTime()
  );

  return (
    <Box>
      {sorted.map((t, i) => (
        <Box key={t.id}>
          {i > 0 && <Divider sx={{ my: 1.5 }} />}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <WorkflowStatusBadge status={t.from_status} />
            <ArrowForward fontSize="small" color="action" />
            <WorkflowStatusBadge status={t.to_status} />
          </Box>
          <Box sx={{ mt: 0.5, display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t.performer?.name ?? `User #${t.performed_by}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getDate(t) ? format(new Date(getDate(t)), 'MMM d, yyyy h:mm a') : '-'}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default WorkflowTimeline;
