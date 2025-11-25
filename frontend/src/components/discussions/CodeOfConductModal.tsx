import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

interface CodeOfConductModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Code of Conduct text content */
  content: string;
  /** Version of the Code of Conduct */
  version: string;
  /** Community name for display */
  communityName: string;
  /** Callback when user successfully accepts */
  onAccept: () => void;
  /** Whether user can dismiss without accepting (false for required acceptance) */
  canDismiss?: boolean;
}

/**
 * CodeOfConductModal component
 *
 * Displays the community discussions Code of Conduct and requires user acceptance
 * before they can participate in discussions. When admin updates the CoC,
 * all users must accept the new version.
 *
 * @example
 * ```tsx
 * <CodeOfConductModal
 *   open={!hasAccepted}
 *   content={config.discussion_code_of_conduct}
 *   version={config.discussion_code_of_conduct_version}
 *   communityName={config.hoa_name}
 *   onAccept={() => setHasAccepted(true)}
 *   canDismiss={false}
 * />
 * ```
 */
const CodeOfConductModal: React.FC<CodeOfConductModalProps> = ({
  open,
  content,
  version,
  communityName,
  onAccept,
  canDismiss = false,
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  const handleAccept = async () => {
    if (!hasRead) {
      setError('Please confirm that you have read and agree to the Code of Conduct');
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);

      await apiService.acceptCodeOfConduct(version);

      showSuccess('Code of Conduct accepted successfully');
      onAccept();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to accept Code of Conduct';
      setError(message);
      showError(message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleClose = (_event: object, reason: string) => {
    // Prevent closing if acceptance is required
    if (!canDismiss && reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      return;
    }
    if (canDismiss) {
      onAccept();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={!canDismiss}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, rgba(0, 51, 102, 0.05) 0%, rgba(79, 107, 90, 0.05) 100%)',
        borderBottom: '2px solid',
        borderColor: 'divider',
      }}>
        <GavelIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Community Discussions Code of Conduct
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {communityName} • Version {version}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {!canDismiss && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You must read and accept this Code of Conduct before participating in community discussions.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          backgroundColor: 'background.paper',
          maxHeight: 400,
          overflowY: 'auto',
          mb: 3,
        }}>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
            }}
          >
            {content || 'Please be respectful and constructive in all community discussions.'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={hasRead}
              onChange={(e) => {
                setHasRead(e.target.checked);
                setError(null);
              }}
              color="primary"
              size="large"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              I have read and agree to follow this Code of Conduct when participating in community discussions
            </Typography>
          }
          sx={{
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': {
              mt: 0.5,
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {canDismiss && (
          <Button
            onClick={() => onAccept()}
            disabled={isAccepting}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleAccept}
          variant="contained"
          disabled={!hasRead || isAccepting}
          startIcon={isAccepting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{ minWidth: 120 }}
        >
          {isAccepting ? 'Accepting...' : 'Accept & Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeOfConductModal;
