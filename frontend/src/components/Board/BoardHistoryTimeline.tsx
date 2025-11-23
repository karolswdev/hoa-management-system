import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Button,
  Pagination,
  useTheme,
  Chip,
} from '@mui/material';
import { History, Login, CalendarToday } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useBoardHistory, useBoardConfig } from '../../hooks/useBoard';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FormHelper from '../common/FormHelper';

/**
 * TimelineItem component for displaying a single history entry
 */
interface TimelineItemProps {
  memberName: string;
  position: string;
  termStart: string;
  termEnd: string;
  boardTitle?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  memberName,
  position,
  termStart,
  termEnd,
  boardTitle,
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card
      sx={{
        border: isHighVisibility ? `2px solid ${theme.palette.primary.dark}` : undefined,
        boxShadow: isHighVisibility ? 'none' : undefined,
        mb: theme.spacing(2),
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="h6" component="h3">
              {memberName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {position}
            </Typography>
            {boardTitle && (
              <Typography variant="body2" color="text.secondary">
                {boardTitle}
              </Typography>
            )}
          </Box>
          <Chip
            icon={<CalendarToday />}
            label={`${formatDate(termStart)} - ${formatDate(termEnd)}`}
            size="small"
            color="primary"
            variant={isHighVisibility ? 'filled' : 'outlined'}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * SkeletonTimelineItem component for loading state
 */
const SkeletonTimelineItem: React.FC = () => {
  const theme = useTheme();
  const { reducedMotion } = useAccessibility();

  return (
    <Card sx={{ mb: theme.spacing(2) }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Skeleton
              variant="text"
              width="40%"
              height={32}
              animation={reducedMotion ? false : 'wave'}
            />
            <Skeleton
              variant="text"
              width="30%"
              animation={reducedMotion ? false : 'wave'}
            />
            <Skeleton
              variant="text"
              width="25%"
              animation={reducedMotion ? false : 'wave'}
            />
          </Box>
          <Skeleton
            variant="rectangular"
            width={120}
            height={24}
            animation={reducedMotion ? false : 'wave'}
            sx={{ borderRadius: '16px' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * BoardHistoryTimeline Component
 *
 * Displays paginated historical board member records with:
 * - Member-only authentication guard
 * - Accessibility-aware skeleton loading
 * - Lazy loading with pagination
 * - High-visibility mode support
 * - FormHelper integration for contextual help
 *
 * @example
 * ```tsx
 * <BoardHistoryTimeline />
 * ```
 */
const BoardHistoryTimeline: React.FC = () => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { historyVisibility, configLoading } = useBoardConfig();
  const { historyItems, pagination, isSkeleton, error } = useBoardHistory(page, limit);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top of timeline on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show skeleton while loading config
  if (configLoading) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Typography variant="h4" component="h2">
            Board History
          </Typography>
        </Box>

        <Box>
          {[1, 2, 3].map((i) => (
            <SkeletonTimelineItem key={i} />
          ))}
        </Box>
      </Box>
    );
  }

  // Handle authentication guard - history is members-only per spec
  if (historyVisibility === 'members-only' && !isAuthenticated) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Board History
        </Typography>

        <Alert
          severity="info"
          icon={<History />}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
          }
        >
          Board history is only available to authenticated HOA members. Please log in to view
          past board members and their terms of service.
        </Alert>
      </Box>
    );
  }

  // Show skeleton while loading history data
  if (isSkeleton) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Typography variant="h4" component="h2">
            Board History
          </Typography>
        </Box>

        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonTimelineItem key={i} />
          ))}
        </Box>
      </Box>
    );
  }

  // Handle errors
  if (error) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Board History
        </Typography>

        <Alert severity="error">
          Failed to load board history. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: theme.spacing(3),
      }}
      role="region"
      aria-label="Board history timeline"
    >
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Typography variant="h4" component="h2">
          Board History
        </Typography>
        <FormHelper
          helpText="A chronological record of past board members, their positions, and terms of service. This information is only available to authenticated HOA members."
          ariaLabel="Help for board history"
          testId="history-helper"
        />
      </Box>

      {historyItems.length === 0 && (
        <Alert severity="info" icon={<History />}>
          No board history records are currently available.
        </Alert>
      )}

      {historyItems.length > 0 && (
        <>
          <Box>
            {historyItems.map((item) => (
              <TimelineItem
                key={item.id}
                memberName={item.member_name}
                position={item.position}
                termStart={item.term_start}
                termEnd={item.term_end}
                boardTitle={item.board_title}
              />
            ))}
          </Box>

          {pagination && pagination.totalPages > 1 && (
            <Box
              display="flex"
              justifyContent="center"
              mt={theme.spacing(4)}
            >
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isHighVisibility ? 'large' : 'medium'}
                showFirstButton
                showLastButton
                aria-label="Board history pagination"
              />
            </Box>
          )}

          {pagination && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
              mt={2}
            >
              Showing {historyItems.length} of {pagination.totalItems} records
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default BoardHistoryTimeline;
