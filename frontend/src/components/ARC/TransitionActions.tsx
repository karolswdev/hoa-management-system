import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from '@mui/material';
import type { WorkflowInstance, WorkflowStatus } from '../../types/api';
import { usePerformTransition } from '../../hooks/useWorkflows';

interface TransitionDef {
  to: WorkflowStatus;
  label: string;
  color: 'primary' | 'success' | 'error' | 'inherit';
  variant: 'contained' | 'outlined';
  confirm?: boolean;
  role: 'submitter' | 'committee';
}

const transitionMap: Partial<Record<WorkflowStatus, TransitionDef[]>> = {
  draft: [{ to: 'submitted', label: 'Submit', color: 'primary', variant: 'contained', role: 'submitter' }],
  submitted: [
    { to: 'under_review', label: 'Begin Review', color: 'primary', variant: 'contained', role: 'committee' },
    { to: 'withdrawn', label: 'Withdraw', color: 'inherit', variant: 'outlined', confirm: true, role: 'submitter' },
  ],
  under_review: [
    { to: 'approved', label: 'Approve', color: 'success', variant: 'contained', role: 'committee' },
    { to: 'denied', label: 'Deny', color: 'error', variant: 'contained', confirm: true, role: 'committee' },
    { to: 'withdrawn', label: 'Withdraw', color: 'inherit', variant: 'outlined', confirm: true, role: 'submitter' },
  ],
  denied: [{ to: 'appealed', label: 'Appeal', color: 'primary', variant: 'contained', role: 'submitter' }],
  appealed: [
    { to: 'appeal_under_review', label: 'Begin Appeal Review', color: 'primary', variant: 'contained', role: 'committee' },
  ],
  appeal_under_review: [
    { to: 'appeal_approved', label: 'Approve Appeal', color: 'success', variant: 'contained', role: 'committee' },
    { to: 'appeal_denied', label: 'Deny Appeal', color: 'error', variant: 'contained', confirm: true, role: 'committee' },
  ],
};

interface TransitionActionsProps {
  workflow: WorkflowInstance;
  isSubmitter: boolean;
  isCommitteeMember: boolean;
}

const TransitionActions: React.FC<TransitionActionsProps> = ({ workflow, isSubmitter, isCommitteeMember }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<TransitionDef | null>(null);
  const [comment, setComment] = useState('');
  const { mutate: performTransition, isPending } = usePerformTransition();

  const available = (transitionMap[workflow.status] ?? []).filter((t) => {
    if (t.role === 'submitter') return isSubmitter;
    if (t.role === 'committee') return isCommitteeMember;
    return false;
  });

  if (!available.length) return null;

  const handleClick = (t: TransitionDef) => {
    setSelectedTransition(t);
    setComment('');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedTransition) return;
    performTransition(
      {
        workflowId: workflow.id,
        data: {
          to_status: selectedTransition.to,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        },
      },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {available.map((t) => (
        <Button
          key={t.to}
          variant={t.variant}
          color={t.color}
          onClick={() => handleClick(t)}
          disabled={isPending}
        >
          {t.label}
        </Button>
      ))}

      <Dialog open={dialogOpen} onClose={() => !isPending && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTransition?.confirm ? 'Confirm Action' : 'Perform Transition'}
        </DialogTitle>
        <DialogContent>
          {selectedTransition?.confirm && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Are you sure you want to {selectedTransition.label.toLowerCase()} this request?
            </Typography>
          )}
          <TextField
            fullWidth
            label="Comment (optional)"
            multiline
            minRows={2}
            maxRows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedTransition?.color ?? 'primary'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {selectedTransition?.label}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransitionActions;
