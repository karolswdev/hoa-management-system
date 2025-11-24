import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import FormHelper from '../common/FormHelper';

/**
 * Props for VoteReceiptChip component
 */
export interface VoteReceiptChipProps {
  /** The vote hash receipt code */
  voteHash: string;
  /** Poll ID for verification link */
  pollId: number;
  /** Whether this is a binding poll (shows additional security info) */
  isBinding?: boolean;
  /** Optional custom label */
  label?: string;
  /** Callback when copy is successful */
  onCopy?: () => void;
}

/**
 * VoteReceiptChip Component
 *
 * A molecule component that displays a vote receipt hash with copy-to-clipboard
 * functionality and verification instructions.
 *
 * Features:
 * - Truncated hash display with full hash in tooltip
 * - One-click copy to clipboard
 * - Visual feedback on successful copy
 * - Helper icon with verification instructions
 * - Accessible keyboard navigation
 * - High visibility mode support
 *
 * Design Tokens Used:
 * - Success Green for verified/copied state
 * - Info Azure for help icon
 * - Onyx outline in High Vis mode
 * - 44px/52px minimum touch target
 *
 * @example
 * ```tsx
 * <VoteReceiptChip
 *   voteHash={receipt.vote_hash}
 *   pollId={pollId}
 *   isBinding={true}
 *   onCopy={() => analytics.track('receipt_copied')}
 * />
 * ```
 */
const VoteReceiptChip: React.FC<VoteReceiptChipProps> = ({
  voteHash,
  pollId,
  isBinding = false,
  label = 'Receipt',
  onCopy,
}) => {
  const theme = useTheme();
  const { isHighVisibility, showHelpers } = useAccessibility();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Truncate hash for display (first 8 and last 8 characters)
  const truncatedHash =
    voteHash.length > 16
      ? `${voteHash.substring(0, 8)}...${voteHash.substring(voteHash.length - 8)}`
      : voteHash;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voteHash);
      setCopied(true);
      setShowToast(true);
      onCopy?.();

      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy receipt:', error);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
  };

  const verificationUrl = `${window.location.origin}/polls/${pollId}/receipts/${voteHash}`;

  const helpText = isBinding
    ? `This is your cryptographic vote receipt. Save this hash to verify your vote was counted. You can verify it at any time by visiting: ${verificationUrl}`
    : `This is your vote confirmation. You can use this to verify your vote was recorded.`;

  const touchTargetSize = isHighVisibility ? 52 : 44;

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          p: 2,
          border: isHighVisibility
            ? `2px solid ${theme.palette.success.main}`
            : `1px solid ${theme.palette.success.light}`,
          borderRadius: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.04)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          <CheckCircle
            sx={{
              color: theme.palette.success.main,
              fontSize: isHighVisibility ? 28 : 24,
            }}
            aria-label="Vote confirmed"
          />
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isHighVisibility ? '0.9rem' : '0.875rem',
                fontWeight: 600,
              }}
            >
              {label}
            </Typography>
            <Tooltip title={voteHash} placement="bottom-start">
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: isHighVisibility ? '1rem' : '0.9rem',
                  wordBreak: 'break-all',
                  color: theme.palette.text.primary,
                }}
              >
                {truncatedHash}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
          <IconButton
            onClick={handleCopy}
            aria-label={copied ? 'Receipt copied' : 'Copy receipt to clipboard'}
            sx={{
              minWidth: touchTargetSize,
              minHeight: touchTargetSize,
              color: copied ? theme.palette.success.main : theme.palette.primary.main,
              border: isHighVisibility
                ? `2px solid ${copied ? theme.palette.success.main : theme.palette.primary.main}`
                : 'none',
              '&:hover': {
                backgroundColor: copied
                  ? 'rgba(76, 175, 80, 0.08)'
                  : 'rgba(29, 140, 216, 0.08)',
              },
            }}
          >
            {copied ? (
              <CheckCircle sx={{ fontSize: isHighVisibility ? 28 : 24 }} />
            ) : (
              <ContentCopy sx={{ fontSize: isHighVisibility ? 28 : 24 }} />
            )}
          </IconButton>
        </Tooltip>

        {showHelpers && (
          <FormHelper
            helpText={helpText}
            ariaLabel="Vote receipt verification instructions"
          />
        )}
      </Box>

      {/* Success toast */}
      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleToastClose}
          severity="success"
          variant="filled"
          sx={{
            fontSize: isHighVisibility
              ? theme.typography.body1.fontSize
              : theme.typography.body2.fontSize,
          }}
        >
          Receipt copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default VoteReceiptChip;
