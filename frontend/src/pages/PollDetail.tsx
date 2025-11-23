import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { ArrowBack, HowToVote } from '@mui/icons-material';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { usePollDetail, useSubmitVote, pollKeys } from '../hooks/usePolls';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../contexts/NotificationContext';
import PollStatusBanner from '../components/Polls/PollStatusBanner';
import PollOptionCard from '../components/Polls/PollOptionCard';
import VoteReceiptChip from '../components/Polls/VoteReceiptChip';

/**
 * PollDetail Page Component
 *
 * Displays a single poll with voting interface, results, and receipt management.
 *
 * Features:
 * - Poll options with radio/checkbox selection
 * - Vote submission with receipt generation (binding polls)
 * - Real-time vote count display (if enabled)
 * - Receipt copy-to-clipboard functionality
 * - Accessibility-aware rendering
 * - Form validation
 * - Error handling
 *
 * Acceptance Criteria:
 * - Vote submissions show receipt + copy functionality
 * - Receipts viewable via route
 * - Tests cover TTL/resume flows
 * - Accessibility compliance
 */
const PollDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pollId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { isHighVisibility } = useAccessibility();
  const { showSuccess, showError } = useNotification();

  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<{
    vote_hash: string;
    poll_id: number;
  } | null>(null);

  const {
    poll,
    options,
    isLoading,
    isSkeleton,
    error,
    isBinding,
    canVote,
    showResults,
    userHasVoted,
  } = usePollDetail(pollId);

  const { submitVote, isPending, receipt } = useSubmitVote();

  // Load saved receipt from localStorage
  useEffect(() => {
    if (pollId) {
      const key = `vote_receipt_${pollId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setSavedReceipt(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored receipt:', e);
        }
      }
    }
  }, [pollId]);

  // Invalidate cache when accessibility mode changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: pollKeys.detail(pollId) });
  }, [isHighVisibility, pollId, queryClient]);

  // Save receipt to localStorage when received
  useEffect(() => {
    if (receipt && pollId) {
      const key = `vote_receipt_${pollId}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          vote_hash: receipt.vote_hash,
          poll_id: pollId,
        })
      );
      setSavedReceipt({
        vote_hash: receipt.vote_hash,
        poll_id: pollId,
      });
    }
  }, [receipt, pollId]);

  const handleOptionChange = (optionId: number, checked: boolean) => {
    if (poll?.allow_multiple) {
      if (checked) {
        setSelectedOptionIds([...selectedOptionIds, optionId]);
      } else {
        setSelectedOptionIds(selectedOptionIds.filter((id) => id !== optionId));
      }
    } else {
      setSelectedOptionIds(checked ? [optionId] : []);
    }
  };

  const handleSubmitVote = () => {
    if (selectedOptionIds.length === 0) {
      showError('Please select at least one option');
      return;
    }

    submitVote(
      {
        pollId,
        data: {
          option_ids: selectedOptionIds,
          request_receipt: isBinding,
        },
      },
      {
        onSuccess: (response) => {
          setVoteSubmitted(true);
          showSuccess('Your vote has been recorded!');

          if (response.receipt) {
            showSuccess('Receipt generated. You can verify your vote at any time.');
          }

          // Clear selection
          setSelectedOptionIds([]);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
          const message =
            error.response?.data?.message || 'Failed to submit vote. Please try again.';
          showError(message);
        },
      }
    );
  };

  const handleBack = () => {
    navigate('/polls');
  };

  const handleViewReceipt = () => {
    if (savedReceipt) {
      navigate(`/polls/${savedReceipt.poll_id}/receipts/${savedReceipt.vote_hash}`);
    }
  };

  if (isLoading || isSkeleton) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="rectangular" height={100} sx={{ my: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Box>
      </Container>
    );
  }

  if (error || !poll) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load poll. Please try again later.
          </Alert>
          <Button startIcon={<ArrowBack />} onClick={handleBack}>
            Back to Polls
          </Button>
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

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontSize: isHighVisibility ? '2.5rem' : '2.125rem',
            fontWeight: 700,
          }}
        >
          {poll.title}
        </Typography>

        {poll.description && (
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{
              fontSize: isHighVisibility ? '1.1rem' : '1rem',
            }}
          >
            {poll.description}
          </Typography>
        )}

        <PollStatusBanner poll={poll} detailed />

        {/* Saved receipt display */}
        {savedReceipt && !voteSubmitted && (
          <Box mb={3}>
            <VoteReceiptChip
              voteHash={savedReceipt.vote_hash}
              pollId={savedReceipt.poll_id}
              isBinding={isBinding}
              label="Your Receipt"
            />
            <Button
              variant="outlined"
              onClick={handleViewReceipt}
              sx={{ mt: 1 }}
              fullWidth={isHighVisibility}
            >
              View Receipt Details
            </Button>
          </Box>
        )}

        {/* Voting interface */}
        {canVote && !voteSubmitted && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <HowToVote color="primary" />
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: isHighVisibility ? '1.35rem' : '1.25rem',
                  fontWeight: 600,
                }}
              >
                Cast Your Vote
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              paragraph
              sx={{
                fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
              }}
            >
              {poll.allow_multiple
                ? 'Select one or more options below:'
                : 'Select one option below:'}
            </Typography>

            {options.map((option) => (
              <PollOptionCard
                key={option.id}
                option={option}
                isMultiSelect={poll.allow_multiple}
                selected={selectedOptionIds.includes(option.id)}
                disabled={isPending}
                showResults={false}
                onChange={handleOptionChange}
                helpText={
                  isBinding && selectedOptionIds.includes(option.id)
                    ? 'This vote will be recorded with a cryptographic hash for verification.'
                    : undefined
                }
              />
            ))}

            <Button
              variant="contained"
              color="primary"
              size={isHighVisibility ? 'large' : 'medium'}
              fullWidth
              onClick={handleSubmitVote}
              disabled={selectedOptionIds.length === 0 || isPending}
              sx={{
                mt: 2,
                minHeight: isHighVisibility ? 52 : 44,
                fontSize: isHighVisibility ? '1.1rem' : '1rem',
              }}
            >
              {isPending ? 'Submitting Vote...' : 'Submit Vote'}
            </Button>
          </Paper>
        )}

        {/* Post-vote receipt display */}
        {voteSubmitted && receipt && (
          <Box mb={3}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your vote has been successfully recorded!
            </Alert>
            <VoteReceiptChip
              voteHash={receipt.vote_hash}
              pollId={pollId}
              isBinding={isBinding}
              label="Vote Receipt"
            />
          </Box>
        )}

        {/* Already voted message */}
        {userHasVoted && !canVote && !voteSubmitted && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have already voted in this poll.
            {savedReceipt && ' Your receipt is displayed above.'}
          </Alert>
        )}

        {/* Results display */}
        {showResults && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
            }}
          >
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              sx={{
                fontSize: isHighVisibility ? '1.35rem' : '1.25rem',
                fontWeight: 600,
              }}
            >
              Results
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {options.map((option) => (
              <PollOptionCard
                key={option.id}
                option={option}
                isMultiSelect={poll.allow_multiple}
                selected={false}
                disabled={true}
                showResults={true}
                totalVotes={poll.total_votes}
                onChange={() => {}}
              />
            ))}

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 2,
                fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
              }}
            >
              Total votes: {poll.total_votes || 0}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default PollDetailPage;
