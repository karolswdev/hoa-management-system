import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Rating,
  Chip,
  useTheme,
} from '@mui/material';
import { Phone, Email, Info } from '@mui/icons-material';
import type { Vendor } from '../../types/api';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';

export interface VendorCardProps {
  vendor: Vendor;
  variant?: 'grid' | 'list';
  onViewDetails?: (vendor: Vendor) => void;
  testId?: string;
}

/**
 * VendorCard Component
 *
 * Displays vendor information in either grid or list layout.
 * Adapts content based on user role and accessibility preferences.
 *
 * Features:
 * - Grid/list layout variants
 * - Role-based content visibility (guests see limited info, members see contact)
 * - Accessibility-aware spacing and font sizes
 * - Category chips with color coding
 * - Rating display for authenticated members
 * - Responsive touch targets (44px/52px min)
 *
 * @example Grid view
 * ```tsx
 * <VendorCard
 *   vendor={vendor}
 *   variant="grid"
 *   onViewDetails={handleViewDetails}
 * />
 * ```
 *
 * @example List view
 * ```tsx
 * <VendorCard
 *   vendor={vendor}
 *   variant="list"
 * />
 * ```
 */
const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  variant = 'grid',
  onViewDetails,
  testId,
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const { isAuthenticated, user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isMember = isAuthenticated;
  const isGuest = !isAuthenticated;

  // Show contact info only to authenticated members
  const showContactInfo = isMember && !!vendor.contact_info;
  // Show rating only to authenticated members
  const showRating = isMember && vendor.rating !== undefined && vendor.rating !== null;
  // Show moderation state only to admins
  const showModerationState = isAdmin && vendor.moderation_state;

  // Parse contact info if available
  const contactInfo = vendor.contact_info ? parseContactInfo(vendor.contact_info) : null;

  // Calculate spacing based on accessibility mode
  const spacing = isHighVisibility ? 2.5 : 2;
  const buttonHeight = isHighVisibility ? 52 : 44;
  const fontSize = isHighVisibility ? theme.typography.fontSize * 1.25 : theme.typography.fontSize;

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(vendor);
    }
  };

  const renderGridCard = () => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isHighVisibility ? `2px solid ${theme.palette.primary.dark}` : 'none',
        boxShadow: isHighVisibility ? 'none' : theme.shadows[2],
        '&:hover': {
          boxShadow: isHighVisibility ? 'none' : theme.shadows[4],
          border: isHighVisibility ? `2px solid ${theme.palette.primary.main}` : 'none',
        },
      }}
      data-testid={testId}
    >
      <CardContent sx={{ flexGrow: 1, p: spacing }}>
        {/* Moderation state badge (admin only) */}
        {showModerationState && (
          <Box mb={1}>
            <Chip
              label={vendor.moderation_state}
              size="small"
              color={
                vendor.moderation_state === 'approved'
                  ? 'success'
                  : vendor.moderation_state === 'pending'
                  ? 'warning'
                  : 'error'
              }
              sx={{ fontSize: fontSize * 0.85 }}
            />
          </Box>
        )}

        {/* Vendor name */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontSize: fontSize * 1.25,
            fontWeight: isHighVisibility ? 700 : 600,
          }}
        >
          {vendor.name}
        </Typography>

        {/* Category chip */}
        <Box mb={spacing}>
          <Chip
            label={vendor.service_category}
            size="small"
            variant={isHighVisibility ? 'outlined' : 'filled'}
            sx={{
              fontSize: fontSize * 0.9,
              borderWidth: isHighVisibility ? 2 : 1,
            }}
          />
        </Box>

        {/* Rating (members only) */}
        {showRating && (
          <Box display="flex" alignItems="center" gap={1} mb={spacing}>
            <Rating
              value={vendor.rating || 0}
              readOnly
              size={isHighVisibility ? 'medium' : 'small'}
            />
            <Typography variant="body2" sx={{ fontSize: fontSize * 0.9 }}>
              ({vendor.rating}/5)
            </Typography>
          </Box>
        )}

        {/* Contact info preview (members only) */}
        {showContactInfo && contactInfo && (
          <Box mt={spacing}>
            {contactInfo.phone && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Phone sx={{ fontSize: fontSize }} />
                <Typography variant="body2" sx={{ fontSize: fontSize * 0.95 }}>
                  {contactInfo.phone}
                </Typography>
              </Box>
            )}
            {contactInfo.email && (
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ fontSize: fontSize }} />
                <Typography variant="body2" sx={{ fontSize: fontSize * 0.95 }}>
                  {contactInfo.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Guest message */}
        {isGuest && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: fontSize * 0.9, mt: spacing }}
          >
            Log in to view contact details
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ p: spacing, pt: 0 }}>
        <Button
          size="small"
          variant={isHighVisibility ? 'outlined' : 'text'}
          onClick={handleViewDetails}
          startIcon={<Info />}
          sx={{
            minHeight: buttonHeight,
            fontSize: fontSize,
          }}
          aria-label={`View details for ${vendor.name}`}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  const renderListCard = () => (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        border: isHighVisibility ? `2px solid ${theme.palette.primary.dark}` : 'none',
        boxShadow: isHighVisibility ? 'none' : theme.shadows[1],
        mb: spacing,
        '&:hover': {
          boxShadow: isHighVisibility ? 'none' : theme.shadows[2],
          border: isHighVisibility ? `2px solid ${theme.palette.primary.main}` : 'none',
        },
      }}
      data-testid={testId}
    >
      <CardContent sx={{ flexGrow: 1, p: spacing, display: 'flex', alignItems: 'center' }}>
        <Box flexGrow={1}>
          <Box display="flex" alignItems="center" gap={spacing} flexWrap="wrap">
            {/* Moderation state badge (admin only) */}
            {showModerationState && (
              <Chip
                label={vendor.moderation_state}
                size="small"
                color={
                  vendor.moderation_state === 'approved'
                    ? 'success'
                    : vendor.moderation_state === 'pending'
                    ? 'warning'
                    : 'error'
                }
                sx={{ fontSize: fontSize * 0.85 }}
              />
            )}

            {/* Vendor name */}
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: fontSize * 1.15,
                fontWeight: isHighVisibility ? 700 : 600,
              }}
            >
              {vendor.name}
            </Typography>

            {/* Category chip */}
            <Chip
              label={vendor.service_category}
              size="small"
              variant={isHighVisibility ? 'outlined' : 'filled'}
              sx={{
                fontSize: fontSize * 0.9,
                borderWidth: isHighVisibility ? 2 : 1,
              }}
            />

            {/* Rating (members only) */}
            {showRating && (
              <Box display="flex" alignItems="center" gap={1}>
                <Rating
                  value={vendor.rating || 0}
                  readOnly
                  size={isHighVisibility ? 'medium' : 'small'}
                />
                <Typography variant="body2" sx={{ fontSize: fontSize * 0.9 }}>
                  ({vendor.rating}/5)
                </Typography>
              </Box>
            )}
          </Box>

          {/* Contact info (members only) */}
          {showContactInfo && contactInfo && (
            <Box display="flex" gap={3} mt={1.5} flexWrap="wrap">
              {contactInfo.phone && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone sx={{ fontSize: fontSize }} />
                  <Typography variant="body2" sx={{ fontSize: fontSize * 0.95 }}>
                    {contactInfo.phone}
                  </Typography>
                </Box>
              )}
              {contactInfo.email && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Email sx={{ fontSize: fontSize }} />
                  <Typography variant="body2" sx={{ fontSize: fontSize * 0.95 }}>
                    {contactInfo.email}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Guest message */}
          {isGuest && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: fontSize * 0.9, mt: 1 }}
            >
              Log in to view contact details
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ p: spacing, alignItems: 'center' }}>
        <Button
          size="small"
          variant={isHighVisibility ? 'outlined' : 'text'}
          onClick={handleViewDetails}
          startIcon={<Info />}
          sx={{
            minHeight: buttonHeight,
            fontSize: fontSize,
          }}
          aria-label={`View details for ${vendor.name}`}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );

  return variant === 'grid' ? renderGridCard() : renderListCard();
};

/**
 * Parse contact info string to extract phone and email
 * Format expected: "Phone: xxx, Email: yyy" or similar
 */
function parseContactInfo(contactInfo: string): { phone?: string; email?: string } {
  const result: { phone?: string; email?: string } = {};

  // Try to extract phone
  const phoneMatch = contactInfo.match(/phone[:\s]+([0-9\-()\\s]+)/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1].trim();
  }

  // Try to extract email
  const emailMatch = contactInfo.match(/email[:\s]+([^\s,]+@[^\s,]+)/i);
  if (emailMatch) {
    result.email = emailMatch[1].trim();
  }

  // If no structured format, check if it's just a phone or email
  if (!result.phone && !result.email) {
    if (contactInfo.includes('@')) {
      result.email = contactInfo.trim();
    } else if (/^\d/.test(contactInfo)) {
      result.phone = contactInfo.trim();
    }
  }

  return result;
}

export default VendorCard;
