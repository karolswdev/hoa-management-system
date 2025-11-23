import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Alert,
  Grid,
  useTheme,
} from '@mui/material';
import {
  HowToVote,
  Lock,
  CheckCircle,
  Schedule,
  FilterList,
} from '@mui/icons-material';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { usePolls, pollKeys } from '../hooks/usePolls';
import { useQueryClient } from '@tanstack/react-query';
import type { PollType, PollStatus, Poll } from '../types/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * Polls Page Component
 *
 * Displays a filterable list of polls with status indicators and quick navigation.
 *
 * Features:
 * - Filter by type (informal/binding) and status (active/closed/all)
 * - Visual status indicators for each poll
 * - Quick navigation to poll details
 * - Accessibility-aware rendering
 * - Loading skeletons
 * - Empty states
 *
 * Acceptance Criteria:
 * - Poll list filters (type/status) work
 * - Upcoming deadlines emphasized
 * - Accessibility compliance
 */
const PollsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isHighVisibility } = useAccessibility();

  const [typeFilter, setTypeFilter] = useState<PollType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PollStatus | 'all'>('all');

  // Build filters object
  const filters = {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { polls, isLoading, isSkeleton, error } = usePolls(filters);

  // Invalidate poll cache when accessibility mode changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: pollKeys.all });
  }, [isHighVisibility, queryClient]);

  const handleTypeFilterChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      setTypeFilter(newValue as PollType | 'all');
    }
  };

  const handleStatusFilterChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      setStatusFilter(newValue as PollStatus | 'all');
    }
  };

  const handlePollClick = (pollId: number) => {
    navigate(`/polls/${pollId}`);
  };

  const renderPollCard = (poll: Poll) => {
    const isBinding = poll.poll_type === 'binding';
    const isActive = poll.status === 'active';
    const isClosed = poll.status === 'closed';
    const userVoted = poll.user_has_voted;

    const endTime = new Date(poll.end_time);
    const now = new Date();
    const timeRemaining = endTime > now ? formatDistanceToNow(endTime, { addSuffix: true }) : null;

    return (
      <Grid key={poll.id} size={{ xs: 12 }}>
        <Card
          sx={{
            border: isHighVisibility
              ? `2px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`
              : `1px solid ${theme.palette.divider}`,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: isHighVisibility ? 'none' : theme.shadows[4],
            },
          }}
        >
          <CardActionArea onClick={() => handlePollClick(poll.id)}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontSize: isHighVisibility ? '1.35rem' : '1.25rem',
                    fontWeight: 600,
                  }}
                >
                  {poll.title}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    label={isBinding ? 'Binding' : 'Informal'}
                    size={isHighVisibility ? 'medium' : 'small'}
                    color={isBinding ? 'warning' : 'info'}
                    icon={isBinding ? <Lock /> : <HowToVote />}
                  />
                  {userVoted && (
                    <Chip
                      label="Voted"
                      size={isHighVisibility ? 'medium' : 'small'}
                      color="success"
                      icon={<CheckCircle />}
                    />
                  )}
                </Box>
              </Box>

              {poll.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontSize: isHighVisibility ? '0.95rem' : '0.875rem',
                  }}
                >
                  {poll.description}
                </Typography>
              )}

              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Chip
                  label={poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                  size="small"
                  color={
                    isActive ? 'success' : isClosed ? 'default' : 'info'
                  }
                  icon={
                    isActive ? <Schedule /> : isClosed ? <CheckCircle /> : <Schedule />
                  }
                />
                {isActive && timeRemaining && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    }}
                  >
                    Closes {timeRemaining}
                  </Typography>
                )}
                {poll.total_votes !== undefined && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: isHighVisibility ? '0.9rem' : '0.8rem',
                    }}
                  >
                    {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontSize: isHighVisibility ? '2.5rem' : '2.125rem',
            fontWeight: 700,
          }}
        >
          Community Polls
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: isHighVisibility ? '1.1rem' : '1rem',
          }}
        >
          Vote on community decisions and view poll results
        </Typography>

        {/* Filters */}
        <Box mb={4} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                fontSize: isHighVisibility ? '0.9rem' : '0.875rem',
                fontWeight: 600,
              }}
            >
              <FilterList sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              Poll Type
            </Typography>
            <ToggleButtonGroup
              value={typeFilter}
              exclusive
              onChange={handleTypeFilterChange}
              aria-label="poll type filter"
              size={isHighVisibility ? 'large' : 'medium'}
            >
              <ToggleButton value="all" aria-label="all types">
                All
              </ToggleButton>
              <ToggleButton value="informal" aria-label="informal polls">
                Informal
              </ToggleButton>
              <ToggleButton value="binding" aria-label="binding polls">
                Binding
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                fontSize: isHighVisibility ? '0.9rem' : '0.875rem',
                fontWeight: 600,
              }}
            >
              <FilterList sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
              Status
            </Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilterChange}
              aria-label="poll status filter"
              size={isHighVisibility ? 'large' : 'medium'}
            >
              <ToggleButton value="all" aria-label="all statuses">
                All
              </ToggleButton>
              <ToggleButton value="active" aria-label="active polls">
                Active
              </ToggleButton>
              <ToggleButton value="closed" aria-label="closed polls">
                Closed
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load polls. Please try again later.
          </Alert>
        )}

        {/* Loading skeletons */}
        {isSkeleton && (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {!isSkeleton && !error && polls.length === 0 && (
          <Alert severity="info">
            No polls found matching your filters.
          </Alert>
        )}

        {/* Poll list */}
        {!isSkeleton && !error && polls.length > 0 && (
          <Grid container spacing={2}>
            {polls.map((poll) => renderPollCard(poll))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default PollsPage;
