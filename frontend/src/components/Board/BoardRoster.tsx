import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Button,
  useTheme,
  Stack,
} from '@mui/material';
import { Person, Email, Phone, Login } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useBoardRoster, useBoardConfig } from '../../hooks/useBoard';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FormHelper from '../common/FormHelper';

/**
 * ContactCard component for displaying individual board member information
 */
interface ContactCardProps {
  name: string;
  position: string;
  email?: string;
  phone?: string;
  boardTitle?: string;
  showContactInfo: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({
  name,
  position,
  email,
  phone,
  boardTitle,
  showContactInfo,
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  return (
    <Card
      sx={{
        border: isHighVisibility ? `2px solid ${theme.palette.primary.dark}` : undefined,
        boxShadow: isHighVisibility ? 'none' : undefined,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Person color="primary" />
          <Typography variant="h6" component="h3">
            {name}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" gutterBottom>
          {position}
        </Typography>

        {boardTitle && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Board: {boardTitle}
          </Typography>
        )}

        {showContactInfo && (
          <Stack spacing={1} mt={2}>
            {email && (
              <Box display="flex" alignItems="center" gap={1}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">
                  <a href={`mailto:${email}`} style={{ color: theme.palette.primary.main }}>
                    {email}
                  </a>
                </Typography>
              </Box>
            )}
            {phone && (
              <Box display="flex" alignItems="center" gap={1}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">
                  <a href={`tel:${phone}`} style={{ color: theme.palette.primary.main }}>
                    {phone}
                  </a>
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * SkeletonCard component for loading state
 */
const SkeletonCard: React.FC = () => {
  const { reducedMotion } = useAccessibility();

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            animation={reducedMotion ? false : 'wave'}
          />
          <Skeleton
            variant="text"
            width="60%"
            height={32}
            animation={reducedMotion ? false : 'wave'}
          />
        </Box>
        <Skeleton
          variant="text"
          width="40%"
          animation={reducedMotion ? false : 'wave'}
        />
        <Skeleton
          variant="text"
          width="30%"
          animation={reducedMotion ? false : 'wave'}
        />
      </CardContent>
    </Card>
  );
};

/**
 * BoardRoster Component
 *
 * Displays the current board members roster with:
 * - Accessibility-aware skeleton loading
 * - Feature flag gating (visibility checks)
 * - Contact information (conditional on config)
 * - Login prompt for restricted content
 * - High-visibility mode support
 * - FormHelper integration for contextual help
 *
 * @example
 * ```tsx
 * <BoardRoster />
 * ```
 */
const BoardRoster: React.FC = () => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { members, isSkeleton, error, lastFetched } = useBoardRoster();
  const { visibility, showContactInfo, configLoading } = useBoardConfig();

  // Show skeleton while loading config or roster
  if (configLoading || isSkeleton) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Typography variant="h4" component="h2">
            Board Members
          </Typography>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns={{
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
          gap={theme.spacing(2)}
        >
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </Box>
      </Box>
    );
  }

  // Handle visibility restrictions
  if (visibility === 'members-only' && !isAuthenticated) {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Board Members
        </Typography>

        <Alert
          severity="info"
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
          Board member information is only available to authenticated HOA members. Please log in
          to view the current board roster.
        </Alert>
      </Box>
    );
  }

  if (visibility === 'restricted') {
    return (
      <Box
        sx={{
          p: theme.spacing(3),
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Board Members
        </Typography>

        <Alert severity="warning">
          The board roster is currently restricted. Please contact the HOA administrator for
          access.
        </Alert>
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
          Board Members
        </Typography>

        <Alert severity="error">
          Failed to load board members. Please try again later.
        </Alert>
      </Box>
    );
  }

  // Group members by board title if present
  const groupedMembers = members.reduce((acc, member) => {
    const title = member.board_title || 'Board Members';
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(member);
    return acc;
  }, {} as Record<string, typeof members>);

  // Sort members by rank within each group
  Object.keys(groupedMembers).forEach((title) => {
    groupedMembers[title].sort((a, b) => a.rank - b.rank);
  });

  return (
    <Box
      sx={{
        p: theme.spacing(3),
      }}
      role="region"
      aria-label="Board members roster"
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="h4" component="h2">
          Board Members
        </Typography>
        <FormHelper
          helpText="The current HOA board members, listed by position. Contact information may be restricted based on your membership status."
          ariaLabel="Help for board roster"
          testId="roster-helper"
        />
      </Box>

      {lastFetched && (
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Updated {new Date(lastFetched).toLocaleString()}
        </Typography>
      )}

      {members.length === 0 && (
        <Alert severity="info">
          No board members are currently listed. Please check back later.
        </Alert>
      )}

      {Object.entries(groupedMembers).map(([title, groupMembers]) => (
        <Box key={title} mb={4}>
          {Object.keys(groupedMembers).length > 1 && (
            <Typography variant="h5" component="h3" gutterBottom>
              {title}
            </Typography>
          )}

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            gap={theme.spacing(isHighVisibility ? 3 : 2)}
          >
            {groupMembers.map((member) => (
              <ContactCard
                key={member.id}
                name={member.name}
                position={member.position}
                email={member.email}
                phone={member.phone}
                boardTitle={
                  Object.keys(groupedMembers).length > 1 ? undefined : member.board_title
                }
                showContactInfo={showContactInfo}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default BoardRoster;
