import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';

const appVersion = (import.meta.env.VITE_APP_VERSION || 'dev').trim();

interface ReleaseBadgeProps {
  compact?: boolean;
}

const ReleaseBadge: React.FC<ReleaseBadgeProps> = ({ compact = false }) => {
  if (!appVersion) {
    return null;
  }

  if (compact) {
    return (
      <Typography variant="caption" color="text.secondary">
        Release {appVersion}
      </Typography>
    );
  }

  return (
    <Tooltip title={`Current deployment: ${appVersion}`}>
      <Box sx={{ display: 'inline-flex' }}>
        <Chip
          label={`Release ${appVersion}`}
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Tooltip>
  );
};

export default ReleaseBadge;
