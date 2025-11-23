import React from 'react';
import {
  Card,
  CardContent,
  Radio,
  Checkbox,
  FormControlLabel,
  Typography,
  LinearProgress,
  Box,
  useTheme,
} from '@mui/material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import FormHelper from '../common/FormHelper';
import type { PollOption } from '../../types/api';

/**
 * Props for PollOptionCard component
 */
export interface PollOptionCardProps {
  /** The poll option to display */
  option: PollOption;
  /** Whether this is a multi-select poll */
  isMultiSelect: boolean;
  /** Whether this option is selected */
  selected: boolean;
  /** Whether voting is disabled */
  disabled?: boolean;
  /** Whether to show vote count results */
  showResults?: boolean;
  /** Total votes across all options (for percentage calculation) */
  totalVotes?: number;
  /** Callback when option is selected/deselected */
  onChange: (optionId: number, checked: boolean) => void;
  /** Optional help text for accessibility */
  helpText?: string;
  /** Optional aria-describedby id */
  ariaDescribedBy?: string;
}

/**
 * PollOptionCard Component
 *
 * A molecule component that renders a poll option with radio/checkbox,
 * vote count visualization, and optional helper icons.
 *
 * Features:
 * - Radio for single-select, Checkbox for multi-select
 * - Vote count bar with percentage
 * - Accessible keyboard navigation
 * - High visibility mode support with enhanced borders
 * - Minimum 44px/52px touch target (standard/high-vis)
 * - Helper icon integration when enabled
 *
 * Design Tokens Used:
 * - 44px/52px minimum touch target
 * - Info Azure for selected state
 * - Onyx border in High Vis mode
 * - 8px border radius for cards
 *
 * @example
 * ```tsx
 * <PollOptionCard
 *   option={option}
 *   isMultiSelect={false}
 *   selected={selectedId === option.id}
 *   showResults={poll.show_results_before_close}
 *   totalVotes={poll.total_votes}
 *   onChange={(id, checked) => setSelectedId(id)}
 * />
 * ```
 */
const PollOptionCard: React.FC<PollOptionCardProps> = ({
  option,
  isMultiSelect,
  selected,
  disabled = false,
  showResults = false,
  totalVotes = 0,
  onChange,
  helpText,
  ariaDescribedBy,
}) => {
  const theme = useTheme();
  const { isHighVisibility, showHelpers } = useAccessibility();

  const voteCount = option.vote_count ?? 0;
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(option.id, event.target.checked);
  };

  const controlId = `poll-option-${option.id}`;
  const helperId = helpText ? `${controlId}-helper` : undefined;

  // Calculate touch target size
  const touchTargetSize = isHighVisibility ? 52 : 44;

  return (
    <Card
      sx={{
        mb: 2,
        border: isHighVisibility
          ? `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`
          : `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        backgroundColor: selected
          ? isHighVisibility
            ? 'rgba(29, 140, 216, 0.08)'
            : 'rgba(29, 140, 216, 0.04)'
          : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': !disabled
          ? {
              borderColor: theme.palette.primary.main,
              boxShadow: isHighVisibility ? 'none' : theme.shadows[2],
            }
          : {},
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => {
        if (!disabled) {
          onChange(option.id, !selected);
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={1}>
          <FormControlLabel
            control={
              isMultiSelect ? (
                <Checkbox
                  id={controlId}
                  checked={selected}
                  onChange={handleChange}
                  disabled={disabled}
                  sx={{
                    minWidth: touchTargetSize,
                    minHeight: touchTargetSize,
                    '& .MuiSvgIcon-root': {
                      fontSize: isHighVisibility ? 28 : 24,
                    },
                  }}
                  inputProps={{
                    'aria-describedby': ariaDescribedBy || helperId,
                  }}
                />
              ) : (
                <Radio
                  id={controlId}
                  checked={selected}
                  onChange={handleChange}
                  disabled={disabled}
                  sx={{
                    minWidth: touchTargetSize,
                    minHeight: touchTargetSize,
                    '& .MuiSvgIcon-root': {
                      fontSize: isHighVisibility ? 28 : 24,
                    },
                  }}
                  inputProps={{
                    'aria-describedby': ariaDescribedBy || helperId,
                  }}
                />
              )
            }
            label={
              <Typography
                variant="body1"
                sx={{
                  fontWeight: selected ? 600 : 400,
                  fontSize: isHighVisibility
                    ? theme.typography.body1.fontSize
                    : theme.typography.body1.fontSize,
                  color: disabled ? 'text.disabled' : 'text.primary',
                }}
              >
                {option.option_text}
              </Typography>
            }
            sx={{
              flex: 1,
              marginRight: 0,
              marginLeft: 0,
              // Prevent double-click from label click
              '& .MuiFormControlLabel-label': {
                cursor: disabled ? 'not-allowed' : 'pointer',
              },
            }}
          />

          {showHelpers && helpText && (
            <FormHelper
              helpText={helpText}
              helpContentId={helperId}
              ariaLabel={`Help for ${option.option_text}`}
            />
          )}
        </Box>

        {/* Vote count visualization */}
        {showResults && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isHighVisibility ? '0.9rem' : '0.875rem',
                }}
              >
                {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isHighVisibility ? '0.9rem' : '0.875rem',
                  fontWeight: 600,
                }}
              >
                {percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: isHighVisibility ? 12 : 8,
                borderRadius: '4px',
                backgroundColor: isHighVisibility
                  ? theme.palette.grey[300]
                  : theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: '4px',
                },
              }}
              aria-label={`${percentage.toFixed(1)}% of votes`}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PollOptionCard;
