import React from 'react';
import { Alert, AlertTitle, Box, Chip, Typography, useTheme } from '@mui/material';
import {
  HowToVote,
  Schedule,
  CheckCircle,
  Lock,
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import type { Poll, PollStatus } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * Props for PollStatusBanner component
 */
export interface PollStatusBannerProps {
  /** The poll to display status for */
  poll: Poll;
  /** Whether to show extended details */
  detailed?: boolean;
}

/**
 * Get severity level based on poll status
 */
function getSeverity(
  status: PollStatus,
  isBinding: boolean
): 'success' | 'info' | 'warning' | 'error' {
  if (status === 'active') {
    return isBinding ? 'warning' : 'info';
  }
  if (status === 'closed') {
    return 'success';
  }
  return 'info'; // draft
}

/**
 * Get icon based on poll status and type
 */
function getIcon(status: PollStatus, isBinding: boolean) {
  if (status === 'active') {
    return isBinding ? <Lock /> : <HowToVote />;
  }
  if (status === 'closed') {
    return <CheckCircle />;
  }
  return <Schedule />; // draft
}

/**
 * PollStatusBanner Component
 *
 * A molecule component that displays poll status, type, and timing information
 * with appropriate visual indicators.
 *
 * Features:
 * - Color-coded status alerts (Info Azure, Success Green, Warning Amber)
 * - Poll type badge (informal vs binding)
 * - Time remaining countdown
 * - Accessibility-aware sizing and contrast
 * - Helper text for binding polls
 *
 * Design Tokens Used:
 * - Alert variants (success, info, warning)
 * - Chip colors for poll types
 * - Accessible iconography
 *
 * @example
 * ```tsx
 * <PollStatusBanner poll={poll} detailed={true} />
 * ```
 */
const PollStatusBanner: React.FC<PollStatusBannerProps> = ({ poll, detailed = false }) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const isBinding = poll.poll_type === 'binding';
  const severity = getSeverity(poll.status, isBinding);
  const icon = getIcon(poll.status, isBinding);

  // Calculate time remaining
  const now = new Date();
  const endTime = new Date(poll.end_time);
  const startTime = new Date(poll.start_time);
  const timeRemaining = endTime > now ? formatDistanceToNow(endTime, { addSuffix: true }) : null;
  const isUpcoming = startTime > now;
  const isActive = poll.status === 'active';
  const isClosed = poll.status === 'closed';

  // Get status message
  let statusMessage = '';
  let statusTitle = '';

  if (isUpcoming) {
    statusTitle = 'Upcoming Poll';
    statusMessage = `Voting opens ${formatDistanceToNow(startTime, { addSuffix: true })}`;
  } else if (isActive) {
    statusTitle = isBinding ? 'Binding Vote Active' : 'Poll Active';
    statusMessage = timeRemaining
      ? `Voting closes ${timeRemaining}`
      : 'Voting is currently open';
  } else if (isClosed) {
    statusTitle = 'Poll Closed';
    statusMessage = `Voting ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
  } else {
    statusTitle = 'Draft Poll';
    statusMessage = 'This poll has not been published yet';
  }

  return (
    <Alert
      severity={severity}
      icon={icon}
      sx={{
        mb: 3,
        fontSize: isHighVisibility
          ? theme.typography.body1.fontSize
          : theme.typography.body2.fontSize,
        '& .MuiAlert-icon': {
          fontSize: isHighVisibility ? 28 : 24,
        },
      }}
    >
      <AlertTitle
        sx={{
          fontSize: isHighVisibility ? '1.1rem' : '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {statusTitle}
        <Chip
          label={isBinding ? 'Binding' : 'Informal'}
          size={isHighVisibility ? 'medium' : 'small'}
          color={isBinding ? 'warning' : 'info'}
          icon={isBinding ? <Lock /> : undefined}
          sx={{
            fontWeight: 600,
            fontSize: isHighVisibility ? '0.85rem' : '0.75rem',
          }}
        />
      </AlertTitle>

      <Typography
        variant="body2"
        sx={{
          fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
        }}
      >
        {statusMessage}
      </Typography>

      {detailed && isBinding && isActive && (
        <Box mt={1}>
          <Typography
            variant="body2"
            sx={{
              fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
              fontStyle: 'italic',
              color: 'text.secondary',
            }}
          >
            This is a binding vote. Your vote will be recorded with a cryptographic hash for
            verification and audit purposes.
          </Typography>
        </Box>
      )}

      {detailed && poll.user_has_voted && (
        <Box mt={1}>
          <Chip
            label="You have voted"
            size="small"
            color="success"
            icon={<CheckCircle />}
            sx={{
              fontWeight: 600,
            }}
          />
        </Box>
      )}
    </Alert>
  );
};

export default PollStatusBanner;
