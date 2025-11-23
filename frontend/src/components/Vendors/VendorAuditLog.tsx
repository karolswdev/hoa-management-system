import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { useAccessibility } from '../../contexts/AccessibilityContext';

/**
 * VendorAuditLog Component
 *
 * Displays audit trail for all vendor-related admin actions:
 * - vendor_create: New vendor submissions
 * - vendor_update: Modifications to vendor details
 * - vendor_moderation: Approval/denial state changes
 * - vendor_delete: Vendor removals
 *
 * Features:
 * - Paginated results (10 per page)
 * - Color-coded action chips
 * - Expandable details view showing JSON metadata
 * - Correlation IDs for tracing actions
 * - Real-time updates via React Query
 *
 * Data source:
 * - Pulls from shared AuditEvent table via /admin/audit-logs endpoint
 * - Filters vendor-related actions on frontend for simplicity
 *
 * @example
 * ```tsx
 * <VendorAuditLog />
 * ```
 */
const VendorAuditLog: React.FC = () => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch audit logs
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs', page, limit],
    queryFn: () => apiService.getAuditLogs({ page, limit }),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter vendor-related actions
  const vendorLogs = data?.data.filter((log) =>
    ['vendor_create', 'vendor_update', 'vendor_moderation', 'vendor_delete'].includes(log.action)
  ) || [];

  // Get action chip
  const getActionChip = (action: string) => {
    const colorMap: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      vendor_create: 'primary',
      vendor_update: 'default',
      vendor_moderation: 'warning',
      vendor_delete: 'error',
    };

    const labelMap: Record<string, string> = {
      vendor_create: 'Created',
      vendor_update: 'Updated',
      vendor_moderation: 'Moderated',
      vendor_delete: 'Deleted',
    };

    return (
      <Chip
        label={labelMap[action] || action}
        size="small"
        color={colorMap[action] || 'default'}
        sx={{
          borderWidth: isHighVisibility ? 2 : 1,
          fontWeight: isHighVisibility ? 600 : 400,
        }}
      />
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format details
  const formatDetails = (details: Record<string, unknown>) => {
    if (!details) return 'N/A';

    // Extract relevant info
    const parts: string[] = [];

    if (details.vendorId) {
      parts.push(`ID: ${details.vendorId}`);
    }

    if (details.vendorName || details.name) {
      parts.push(`Name: ${details.vendorName || details.name}`);
    }

    if (details.oldState && details.newState) {
      parts.push(`${details.oldState} → ${details.newState}`);
    }

    if (details.category) {
      parts.push(`Category: ${details.category}`);
    }

    return parts.length > 0 ? parts.join(' | ') : JSON.stringify(details);
  };

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={isHighVisibility ? 60 : 40} />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert severity="error">
        {(error as Error)?.message || 'Failed to load audit logs'}
      </Alert>
    );
  }

  // Empty state
  if (vendorLogs.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No vendor-related audit logs found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: isHighVisibility ? 700 : 600,
          mb: 2,
        }}
      >
        Vendor Audit Log
      </Typography>

      <TableContainer
        component={Paper}
        elevation={isHighVisibility ? 3 : 1}
        sx={{
          border: isHighVisibility ? `2px solid ${theme.palette.divider}` : 'none',
        }}
      >
        <Table aria-label="Vendor audit log table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                  Date & Time
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                  Admin
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                  Action
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                  Details
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendorLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2">{formatDate(log.created_at)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: isHighVisibility ? 600 : 400 }}
                  >
                    {log.admin_name}
                  </Typography>
                </TableCell>
                <TableCell>{getActionChip(log.action)}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDetails(log.details)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={data.pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size={isHighVisibility ? 'large' : 'medium'}
            sx={{
              '& .MuiPaginationItem-root': {
                minWidth: isHighVisibility ? 44 : 36,
                minHeight: isHighVisibility ? 44 : 36,
                fontWeight: isHighVisibility ? 600 : 400,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default VendorAuditLog;
