import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Drawer,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import {
  GridView,
  ViewList,
  Add,
  Close,
} from '@mui/icons-material';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../contexts/AuthContext';
import { useVendors, useCreateVendor } from '../hooks/useVendors';
import VendorCard from '../components/Vendors/VendorCard';
import VendorFilters from '../components/Vendors/VendorFilters';
import VendorForm from '../components/Vendors/VendorForm';
import type { Vendor, VendorFilter, CreateVendorRequest } from '../types/api';

/**
 * Vendors Page Component
 *
 * Resident-facing vendor directory with comprehensive features:
 * - Grid/list view toggle with responsive layout
 * - Category and search filters
 * - Detail drawer for expanded vendor info
 * - Vendor submission form (gated by authentication)
 * - Role-based visibility (guests see limited, members see contact info)
 * - React Query caching with automatic invalidation
 * - Accessibility integration (high-vis mode, helpers, reduced motion)
 *
 * Architecture:
 * - Uses useVendors hook for data fetching with 60s cache
 * - Client-side filtering for rating (post-fetch)
 * - Server-side filtering for category and search
 * - Cache invalidation on submission via React Query
 *
 * @example
 * ```tsx
 * <Route path="/vendors" element={<Vendors />} />
 * ```
 */
const Vendors: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isHighVisibility, reducedMotion } = useAccessibility();
  const { isAuthenticated, user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<VendorFilter>({});
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data fetching
  const { vendors, count, isLoading, isError, error, refetch } = useVendors(filters);
  const createVendor = useCreateVendor();

  // Accessibility-aware spacing and sizing
  const spacing = isHighVisibility ? 3 : 2;
  const fontSize = isHighVisibility ? theme.typography.fontSize * 1.25 : theme.typography.fontSize;
  const buttonHeight = isHighVisibility ? 52 : 44;

  // Extract unique categories from vendors
  const categories = useMemo(() => {
    const categorySet = new Set(vendors.map((v) => v.service_category));
    return Array.from(categorySet).sort();
  }, [vendors]);

  // Handle view mode toggle
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'list' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Handle vendor detail view
  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Delay clearing selected vendor for smooth transition
    if (!reducedMotion) {
      setTimeout(() => setSelectedVendor(null), 300);
    } else {
      setSelectedVendor(null);
    }
  };

  // Handle vendor submission
  const handleSubmitVendor = async (data: CreateVendorRequest) => {
    await createVendor.mutateAsync(data);
    const isAdmin = user?.role === 'admin';
    setToastMessage(
      isAdmin
        ? 'Vendor added successfully!'
        : 'Vendor submitted for review. You will be notified once approved.'
    );
    setIsFormOpen(false);
  };

  // Invalidate cache when accessibility mode changes
  useEffect(() => {
    // Only refetch if vendors are already loaded
    if (vendors.length > 0) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHighVisibility]);

  // Handle login prompt for guests
  const handleLoginPrompt = () => {
    window.location.href = '/login?redirect=/vendors';
  };

  return (
    <Container maxWidth="xl" sx={{ py: spacing * 2 }}>
      {/* Page header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={spacing}
        flexWrap="wrap"
        gap={spacing}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontSize: fontSize * 2,
              fontWeight: isHighVisibility ? 700 : 600,
            }}
          >
            Vendor Directory
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: fontSize }}
          >
            Find trusted service providers recommended by the community
          </Typography>
        </Box>

        <Box display="flex" gap={spacing} alignItems="center">
          {/* View toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            sx={{
              '& .MuiToggleButton-root': {
                minHeight: buttonHeight,
                minWidth: buttonHeight,
                borderWidth: isHighVisibility ? 2 : 1,
              },
            }}
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridView />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewList />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Add vendor button */}
          {isAuthenticated ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsFormOpen(true)}
              sx={{
                minHeight: buttonHeight,
                fontSize: fontSize,
              }}
            >
              {isMobile ? 'Add' : 'Submit Vendor'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={handleLoginPrompt}
              sx={{
                minHeight: buttonHeight,
                fontSize: fontSize,
              }}
            >
              Login to Submit
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box mb={spacing}>
        <VendorFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />
      </Box>

      {/* Guest notice */}
      {!isAuthenticated && (
        <Alert
          severity="info"
          sx={{
            mb: spacing,
            fontSize: fontSize,
          }}
        >
          You are viewing limited information. <Button onClick={handleLoginPrompt}>Log in</Button> to see contact details and ratings.
        </Alert>
      )}

      {/* Error state */}
      {isError && (
        <Alert
          severity="error"
          sx={{ mb: spacing, fontSize: fontSize }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error?.message || 'Failed to load vendors. Please try again.'}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={spacing * 4}>
          <CircularProgress size={isHighVisibility ? 60 : 40} />
        </Box>
      )}

      {/* Vendors list */}
      {!isLoading && vendors.length > 0 && (
        <>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontSize: fontSize * 1.5,
              fontWeight: isHighVisibility ? 700 : 600,
              mb: spacing * 0.5,
              mt: spacing,
            }}
          >
            Available Vendors
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: spacing, fontSize: fontSize * 0.95 }}
          >
            Showing {count} {count === 1 ? 'vendor' : 'vendors'}
            {filters.category && ` in ${filters.category}`}
          </Typography>

          {viewMode === 'grid' ? (
            <Grid container spacing={spacing}>
              {vendors.map((vendor) => (
                <Grid xs={12} sm={6} md={4} lg={3} key={vendor.id}>
                  <VendorCard
                    vendor={vendor}
                    variant="grid"
                    onViewDetails={handleViewDetails}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  variant="list"
                  onViewDetails={handleViewDetails}
                />
              ))}
            </Box>
          )}
        </>
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
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: fontSize * 1.3,
              fontWeight: isHighVisibility ? 700 : 600,
            }}
          >
            No vendors found
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: spacing, fontSize: fontSize }}
          >
            {filters.category || filters.search
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to add a vendor to the directory!'}
          </Typography>
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setIsFormOpen(true)}
              sx={{
                minHeight: buttonHeight,
                fontSize: fontSize,
              }}
            >
              Submit a Vendor
            </Button>
          )}
        </Box>
      )}

      {/* Detail drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400, md: 500 },
            p: spacing,
            border: isHighVisibility ? `2px solid ${theme.palette.primary.main}` : 'none',
          },
        }}
      >
        {selectedVendor && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={spacing}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: fontSize * 1.5,
                  fontWeight: isHighVisibility ? 700 : 600,
                }}
              >
                {selectedVendor.name}
              </Typography>
              <IconButton
                onClick={handleCloseDrawer}
                aria-label="Close details"
                sx={{
                  minWidth: buttonHeight,
                  minHeight: buttonHeight,
                }}
              >
                <Close />
              </IconButton>
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                color="primary"
                gutterBottom
                sx={{ fontSize: fontSize * 1.1, fontWeight: 600 }}
              >
                Category
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: spacing, fontSize: fontSize }}
              >
                {selectedVendor.service_category}
              </Typography>

              {isAuthenticated && selectedVendor.contact_info && (
                <>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{ fontSize: fontSize * 1.1, fontWeight: 600 }}
                  >
                    Contact Information
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: spacing, fontSize: fontSize, whiteSpace: 'pre-line' }}
                  >
                    {selectedVendor.contact_info}
                  </Typography>
                </>
              )}

              {isAuthenticated && selectedVendor.rating && (
                <>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{ fontSize: fontSize * 1.1, fontWeight: 600 }}
                  >
                    Rating
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: spacing, fontSize: fontSize }}
                  >
                    {selectedVendor.rating} out of 5 stars
                  </Typography>
                </>
              )}

              {selectedVendor.notes && (
                <>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{ fontSize: fontSize * 1.1, fontWeight: 600 }}
                  >
                    Notes
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: spacing, fontSize: fontSize, whiteSpace: 'pre-line' }}
                  >
                    {selectedVendor.notes}
                  </Typography>
                </>
              )}

              {user?.role === 'admin' && selectedVendor.moderation_state && (
                <>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    gutterBottom
                    sx={{ fontSize: fontSize * 1.1, fontWeight: 600 }}
                  >
                    Moderation Status
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: spacing, fontSize: fontSize }}
                  >
                    {selectedVendor.moderation_state}
                  </Typography>
                </>
              )}
            </Box>
          </>
        )}
      </Drawer>

      {/* Vendor submission form */}
      <VendorForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitVendor}
        categories={categories}
      />

      {/* Success toast */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={6000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
        ContentProps={{
          'aria-live': 'polite',
          role: 'status',
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setToastMessage(null)}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default Vendors;
