import React from 'react';
import { Chip } from '@mui/material';
import type { WorkflowStatus } from '../../types/api';

const statusConfig: Record<WorkflowStatus, { color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  draft: { color: 'default' },
  submitted: { color: 'info' },
  under_review: { color: 'warning' },
  approved: { color: 'success' },
  denied: { color: 'error' },
  withdrawn: { color: 'default' },
  appealed: { color: 'warning' },
  appeal_under_review: { color: 'warning' },
  appeal_approved: { color: 'success' },
  appeal_denied: { color: 'error' },
  expired: { color: 'default' },
};

function formatStatus(status: WorkflowStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  size?: 'small' | 'medium';
}

const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({ status, size = 'small' }) => {
  const config = statusConfig[status] ?? { color: 'default' as const };
  return <Chip label={formatStatus(status)} color={config.color} size={size} />;
};

export default WorkflowStatusBadge;
