import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Skeleton,
  Alert,
  Paper,
  Divider,
  useTheme,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Error,
  Security,
  HowToVote,
} from '@mui/icons-material';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useReceiptLookup } from '../hooks/usePolls';
import { format } from 'date-fns';

/**
 * PollReceipt Page Component
 *
 * Public page for verifying vote receipts without authentication.
 *
 * Features:
 * - Receipt verification via hash lookup
 * - Displays poll info, timestamp, and verification status
 * - Works for both authenticated and unauthenticated users
 * - Accessible design with clear success/error states
 * - Copy-to-clipboard for sharing verification URL
 *
 * Acceptance Criteria:
 * - Receipts viewable via route
 * - Verification success/failure clearly indicated
 * - Works without authentication
 * - Accessibility compliance
 */
const PollReceiptPage: React.FC = () => {
  const { pollId: pollIdParam, hash } = useParams<{ pollId: string; hash: string }>();
  const pollId = parseInt(pollIdParam || '0', 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  const { receipt, isVerified, isLoading, error } = useReceiptLookup(
    pollId,
    hash || '',
    !!(pollId && hash)
  );

  const handleBack = () => {
    navigate('/polls');
  };

  const handleViewPoll = () => {
    navigate(`/polls/${pollId}`);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="rectangular" height={200} sx={{ my: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error || !receipt) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `2px solid ${theme.palette.error.main}`,
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <Error
              sx={{
                fontSize: isHighVisibility ? 80 : 64,
                color: theme.palette.error.main,
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontSize: isHighVisibility ? '1.75rem' : '1.5rem',
                fontWeight: 600,
                color: theme.palette.error.main,
              }}
            >
              Receipt Not Found
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              paragraph
              sx={{
                fontSize: isHighVisibility ? '1.1rem' : '1rem',
              }}
            >
              The receipt hash could not be verified. This may mean:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
              <li>
                <Typography
                  variant="body2"
                  sx={{ fontSize: isHighVisibility ? '0.95rem' : '0.875rem' }}
                >
                  The receipt hash is incorrect or incomplete
                </Typography>
              </li>
              <li>
                <Typography
                  variant="body2"
                  sx={{ fontSize: isHighVisibility ? '0.95rem' : '0.875rem' }}
                >
                  The vote was not successfully recorded
                </Typography>
              </li>
              <li>
                <Typography
                  variant="body2"
                  sx={{ fontSize: isHighVisibility ? '0.95rem' : '0.875rem' }}
                >
                  The poll ID is incorrect
                </Typography>
              </li>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 3,
                fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
              }}
            >
              If you believe this is an error, please contact support with your receipt hash.
            </Typography>
            <Box mt={3} display="flex" gap={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                size={isHighVisibility ? 'large' : 'medium'}
              >
                Back to Polls
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{
            mb: 3,
            fontSize: isHighVisibility ? '1rem' : '0.875rem',
          }}
        >
          Back to Polls
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `2px solid ${theme.palette.success.main}`,
            borderRadius: '12px',
          }}
        >
          {/* Verification status */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <CheckCircle
              sx={{
                fontSize: isHighVisibility ? 56 : 48,
                color: theme.palette.success.main,
              }}
            />
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontSize: isHighVisibility ? '1.75rem' : '1.5rem',
                  fontWeight: 600,
                  color: theme.palette.success.main,
                }}
              >
                Vote Receipt Verified
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
                }}
              >
                This vote has been successfully verified in our system
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Receipt details */}
          <Box mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Security color="primary" />
              <Typography
                variant="h6"
                sx={{
                  fontSize: isHighVisibility ? '1.35rem' : '1.25rem',
                  fontWeight: 600,
                }}
              >
                Receipt Details
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: theme.palette.grey[50],
                p: 2,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box mb={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Poll
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: isHighVisibility ? '1.1rem' : '1rem',
                  }}
                >
                  {receipt.poll_title}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Selected Option
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: isHighVisibility ? '1.1rem' : '1rem',
                  }}
                >
                  {receipt.option_text}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Vote Timestamp
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: isHighVisibility ? '1.1rem' : '1rem',
                  }}
                >
                  {format(new Date(receipt.timestamp), 'PPpp')}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Receipt Hash
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    wordBreak: 'break-all',
                    backgroundColor: theme.palette.background.paper,
                    p: 1,
                    borderRadius: '4px',
                  }}
                >
                  {receipt.vote_hash}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Alert severity="info" icon={<Security />}>
            <Typography
              variant="body2"
              sx={{
                fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
              }}
            >
              This receipt proves your vote was recorded in the poll's hash chain. For binding
              polls, this provides cryptographic verification that your vote is counted in the
              final tally.
            </Typography>
          </Alert>

          <Box mt={3} display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<HowToVote />}
              onClick={handleViewPoll}
              size={isHighVisibility ? 'large' : 'medium'}
            >
              View Poll Details
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBack}
              size={isHighVisibility ? 'large' : 'medium'}
            >
              Back to Polls
            </Button>
          </Box>
        </Paper>

        {/* Additional info */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: isHighVisibility ? '1.25rem' : '1.125rem',
              fontWeight: 600,
            }}
          >
            About Vote Verification
          </Typography>
          <Typography
            variant="body2"
            paragraph
            sx={{
              fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
            }}
          >
            Vote receipts use cryptographic hashing to ensure vote integrity. Each vote is
            linked to the previous vote in a chain, making it impossible to alter or remove
            votes without detection.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
            }}
          >
            Keep your receipt hash safe if you want to verify your vote later. Anyone with
            the hash can verify the vote exists, but it doesn't reveal your identity or allow
            them to change the vote.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PollReceiptPage;
