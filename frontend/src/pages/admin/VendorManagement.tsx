import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useVendors, useVendorStats, useModerateVendor, useUpdateVendor, useDeleteVendor } from '../../hooks/useVendors';
import VendorAdminTable from '../../components/Vendors/VendorAdminTable';
import VendorAuditLog from '../../components/Vendors/VendorAuditLog';
import type { Vendor } from '../../types/api';

/**
 * Admin Vendor Management Page
 *
 * Features:
 * - Pending/Approved/Denied tabs for vendor moderation
 * - Bulk moderation actions (approve/deny multiple vendors)
 * - Individual vendor edit/delete operations
 * - Audit log view showing all vendor-related admin actions
 * - Statistics dashboard with real-time metrics
 * - Confirmation modals for destructive actions
 * - Role-gated access (admin only)
 *
 * Architecture:
 * - Uses useVendors hook with status filter for each tab
 * - React Query cache invalidation on moderation actions
 * - Metrics counters update automatically via backend integration
 * - Audit logs pulled from shared AuditEvent table
 *
 * @example
 * ```tsx
 * <Route path="/admin/vendors" element={<VendorManagement />} />
 * ```
 */
const VendorManagement: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { isHighVisibility } = useAccessibility();

  // Tab state
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ open: false, title: '', message: '', action: () => {} });

  // Audit log visibility
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Data fetching
  const { vendors: pendingVendors, isLoading: loadingPending, refetch: refetchPending } = useVendors({ status: 'pending' });
  const { vendors: approvedVendors, isLoading: loadingApproved, refetch: refetchApproved } = useVendors({ status: 'approved' });
  const { vendors: deniedVendors, isLoading: loadingDenied, refetch: refetchDenied } = useVendors({ status: 'denied' });
  const { stats, isLoading: loadingStats } = useVendorStats();

  // Mutations
  const moderateVendor = useModerateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  // Accessibility spacing
  const spacing = isHighVisibility ? 3 : 2;
  const buttonHeight = isHighVisibility ? 52 : 44;

  // Get current vendors based on active tab
  const { vendors, isLoading } = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return { vendors: pendingVendors, isLoading: loadingPending };
      case 'approved':
        return { vendors: approvedVendors, isLoading: loadingApproved };
      case 'denied':
        return { vendors: deniedVendors, isLoading: loadingDenied };
      default:
        return { vendors: [], isLoading: false };
    }
  }, [activeTab, pendingVendors, approvedVendors, deniedVendors, loadingPending, loadingApproved, loadingDenied]);

  // Tab counts from stats
  const tabCounts = useMemo(() => {
    if (!stats) return { pending: 0, approved: 0, denied: 0 };

    const counts = { pending: 0, approved: 0, denied: 0 };
    stats.byModerationState?.forEach((item: { state: string; count: number }) => {
      if (item.state in counts) {
        counts[item.state as keyof typeof counts] = item.count;
      }
    });
    return counts;
  }, [stats]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: 'pending' | 'approved' | 'denied') => {
    setActiveTab(newValue);
    setSelectedVendors([]);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchPending();
    refetchApproved();
    refetchDenied();
  };

  // Handle selection
  const handleSelectionChange = (vendorIds: number[]) => {
    setSelectedVendors(vendorIds);
  };

  // Handle bulk approve
  const handleBulkApprove = () => {
    setConfirmDialog({
      open: true,
      title: 'Approve Selected Vendors',
      message: `Are you sure you want to approve ${selectedVendors.length} vendor(s)? They will become visible to members.`,
      action: async () => {
        try {
          for (const vendorId of selectedVendors) {
            await moderateVendor.mutateAsync({ id: vendorId, moderation_state: 'approved' });
          }
          enqueueSnackbar(`Successfully approved ${selectedVendors.length} vendor(s)`, { variant: 'success' });
          setSelectedVendors([]);
        } catch (error: any) {
          enqueueSnackbar(error.response?.data?.message || 'Failed to approve vendors', { variant: 'error' });
        }
      },
    });
  };

  // Handle bulk deny
  const handleBulkDeny = () => {
    setConfirmDialog({
      open: true,
      title: 'Deny Selected Vendors',
      message: `Are you sure you want to deny ${selectedVendors.length} vendor(s)? They will not be visible to members.`,
      action: async () => {
        try {
          for (const vendorId of selectedVendors) {
            await moderateVendor.mutateAsync({ id: vendorId, moderation_state: 'denied' });
          }
          enqueueSnackbar(`Successfully denied ${selectedVendors.length} vendor(s)`, { variant: 'success' });
          setSelectedVendors([]);
        } catch (error: any) {
          enqueueSnackbar(error.response?.data?.message || 'Failed to deny vendors', { variant: 'error' });
        }
      },
    });
  };

  // Handle individual moderation action
  const handleModerate = (vendorId: number, newState: 'pending' | 'approved' | 'denied') => {
    const actionVerb = newState === 'approved' ? 'approve' : newState === 'denied' ? 'deny' : 'mark as pending';
    setConfirmDialog({
      open: true,
      title: `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} Vendor`,
      message: `Are you sure you want to ${actionVerb} this vendor?`,
      action: async () => {
        try {
          await moderateVendor.mutateAsync({ id: vendorId, moderation_state: newState });
          enqueueSnackbar(`Vendor ${actionVerb}d successfully`, { variant: 'success' });
        } catch (error: any) {
          enqueueSnackbar(error.response?.data?.message || `Failed to ${actionVerb} vendor`, { variant: 'error' });
        }
      },
    });
  };

  // Handle delete
  const handleDelete = (vendorId: number, vendorName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Vendor',
      message: `Are you sure you want to permanently delete "${vendorName}"? This action cannot be undone.`,
      action: async () => {
        try {
          await deleteVendor.mutateAsync(vendorId);
          enqueueSnackbar('Vendor deleted successfully', { variant: 'success' });
        } catch (error: any) {
          enqueueSnackbar(error.response?.data?.message || 'Failed to delete vendor', { variant: 'error' });
        }
      },
    });
  };

  // Close confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false, title: '', message: '', action: () => {} });
  };

  // Execute confirmed action
  const handleConfirmAction = async () => {
    await confirmDialog.action();
    handleCloseConfirmDialog();
  };

  return (
    <Box>
      {/* Page header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={spacing}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: isHighVisibility ? 700 : 600,
            }}
          >
            Vendor Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and moderate vendor submissions
          </Typography>
        </Box>

        <Box display="flex" gap={spacing}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ minHeight: buttonHeight }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowAuditLog(!showAuditLog)}
            sx={{ minHeight: buttonHeight }}
          >
            {showAuditLog ? 'Hide' : 'Show'} Audit Log
          </Button>
        </Box>
      </Box>

      {/* Statistics cards */}
      {!loadingStats && stats && (
        <Box display="flex" gap={spacing} mb={spacing} flexWrap="wrap">
          <Box
            sx={{
              p: spacing,
              bgcolor: 'warning.light',
              borderRadius: 1,
              minWidth: 120,
              border: isHighVisibility ? `2px solid ${theme.palette.warning.dark}` : 'none',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark' }}>
              {tabCounts.pending}
            </Typography>
            <Typography variant="body2" sx={{ color: 'warning.dark' }}>
              Pending Review
            </Typography>
          </Box>
          <Box
            sx={{
              p: spacing,
              bgcolor: 'success.light',
              borderRadius: 1,
              minWidth: 120,
              border: isHighVisibility ? `2px solid ${theme.palette.success.dark}` : 'none',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
              {tabCounts.approved}
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.dark' }}>
              Approved
            </Typography>
          </Box>
          <Box
            sx={{
              p: spacing,
              bgcolor: 'error.light',
              borderRadius: 1,
              minWidth: 120,
              border: isHighVisibility ? `2px solid ${theme.palette.error.dark}` : 'none',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.dark' }}>
              {tabCounts.denied}
            </Typography>
            <Typography variant="body2" sx={{ color: 'error.dark' }}>
              Denied
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: spacing }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Vendor moderation tabs"
          sx={{
            '& .MuiTab-root': {
              minHeight: buttonHeight,
              fontWeight: isHighVisibility ? 600 : 400,
            },
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Pending fontSize="small" />
                Pending ({tabCounts.pending})
              </Box>
            }
            value="pending"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle fontSize="small" />
                Approved ({tabCounts.approved})
              </Box>
            }
            value="approved"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Cancel fontSize="small" />
                Denied ({tabCounts.denied})
              </Box>
            }
            value="denied"
          />
        </Tabs>
      </Box>

      {/* Bulk actions */}
      {selectedVendors.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: spacing }}
          action={
            <Box display="flex" gap={1}>
              {activeTab === 'pending' && (
                <>
                  <Button size="small" color="success" onClick={handleBulkApprove}>
                    Approve ({selectedVendors.length})
                  </Button>
                  <Button size="small" color="error" onClick={handleBulkDeny}>
                    Deny ({selectedVendors.length})
                  </Button>
                </>
              )}
              {activeTab === 'denied' && (
                <Button size="small" color="success" onClick={handleBulkApprove}>
                  Approve ({selectedVendors.length})
                </Button>
              )}
              {activeTab === 'approved' && (
                <Button size="small" color="error" onClick={handleBulkDeny}>
                  Deny ({selectedVendors.length})
                </Button>
              )}
            </Box>
          }
        >
          {selectedVendors.length} vendor(s) selected
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={spacing * 4}>
          <CircularProgress size={isHighVisibility ? 60 : 40} />
        </Box>
      )}

      {/* Vendor table */}
      {!isLoading && (
        <VendorAdminTable
          vendors={vendors}
          selectedVendors={selectedVendors}
          onSelectionChange={handleSelectionChange}
          onModerate={handleModerate}
          onDelete={handleDelete}
          currentTab={activeTab}
        />
      )}

      {/* Empty state */}
      {!isLoading && vendors.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={spacing * 6}
          textAlign="center"
        >
          <Typography variant="h6" gutterBottom>
            No {activeTab} vendors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 'pending' && 'All vendor submissions have been reviewed.'}
            {activeTab === 'approved' && 'No vendors have been approved yet.'}
            {activeTab === 'denied' && 'No vendors have been denied yet.'}
          </Typography>
        </Box>
      )}

      {/* Audit log */}
      {showAuditLog && (
        <Box mt={spacing * 3}>
          <VendorAuditLog />
        </Box>
      )}

      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: spacing }}>
          <Button onClick={handleCloseConfirmDialog} sx={{ minHeight: buttonHeight }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color="primary"
            sx={{ minHeight: buttonHeight }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorManagement;
