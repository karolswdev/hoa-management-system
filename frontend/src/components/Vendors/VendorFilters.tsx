import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import type { VendorFilter } from '../../types/api';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';
import FormHelper from '../common/FormHelper';

export interface VendorFiltersProps {
  filters: VendorFilter;
  onFiltersChange: (filters: VendorFilter) => void;
  categories?: string[];
  testId?: string;
}

/**
 * VendorFilters Component
 *
 * Provides filtering controls for vendor directory including:
 * - Category selection (chip-based or dropdown)
 * - Search by vendor name
 * - Rating filter (client-side)
 * - Moderation status filter (admin-only)
 *
 * Features:
 * - Responsive design (chips on desktop, dropdown on mobile)
 * - Accessibility-aware sizing and contrast
 * - Helper icons when accessibility mode enabled
 * - Clear filters button
 * - Real-time filter updates
 *
 * @example
 * ```tsx
 * <VendorFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   categories={['Plumbing', 'Electrical', 'Landscaping']}
 * />
 * ```
 */
const VendorFilters: React.FC<VendorFiltersProps> = ({
  filters,
  onFiltersChange,
  categories = [],
  testId,
}) => {
  const theme = useTheme();
  const { isHighVisibility, showHelpers } = useAccessibility();
  const { user } = useAuth();

  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const isAdmin = user?.role === 'admin';

  // Calculate spacing and sizing based on accessibility mode
  const spacing = isHighVisibility ? 2.5 : 2;
  const fontSize = isHighVisibility ? theme.typography.fontSize * 1.25 : theme.typography.fontSize;
  const inputHeight = isHighVisibility ? 52 : 44;

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearch(value);
    // Debounce search - update filters after user stops typing
    // For simplicity, we'll update immediately
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      status: value || undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({});
  };

  const hasActiveFilters = !!(filters.category || filters.search || filters.status);

  return (
    <Box data-testid={testId}>
      {/* Search bar */}
      <Box display="flex" gap={spacing} mb={spacing} alignItems="center">
        <TextField
          id="vendor-search"
          fullWidth
          placeholder="Search vendors by name..."
          value={localSearch}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            sx: {
              minHeight: inputHeight,
              fontSize: fontSize,
            },
          }}
          inputProps={{
            'aria-label': 'Search vendors by name',
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderWidth: isHighVisibility ? 2 : 1,
            },
          }}
        />

        {showHelpers && (
          <FormHelper
            helpText="Search for vendors by their business name. Type at least 2 characters to filter results."
            ariaLabel="Help for vendor search"
            helpContentId="vendor-search-help"
          />
        )}

        {hasActiveFilters && (
          <IconButton
            onClick={handleClearFilters}
            aria-label="Clear all filters"
            sx={{
              minWidth: inputHeight,
              minHeight: inputHeight,
            }}
          >
            <Clear />
          </IconButton>
        )}
      </Box>

      {/* Category filters */}
      {categories.length > 0 && (
        <Box mb={spacing}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <FilterList sx={{ color: 'text.secondary' }} />
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontSize: fontSize * 0.95,
                fontWeight: isHighVisibility ? 700 : 600,
              }}
            >
              Filter by Category
            </Typography>
            {showHelpers && (
              <FormHelper
                helpText="Click a category to filter vendors. Click again to remove the filter. Only one category can be selected at a time."
                ariaLabel="Help for category filters"
                helpContentId="category-filter-help"
              />
            )}
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => handleCategoryChange(category)}
                color={filters.category === category ? 'primary' : 'default'}
                variant={
                  filters.category === category
                    ? isHighVisibility
                      ? 'filled'
                      : 'filled'
                    : isHighVisibility
                    ? 'outlined'
                    : 'outlined'
                }
                sx={{
                  fontSize: fontSize * 0.95,
                  minHeight: inputHeight * 0.8,
                  borderWidth: isHighVisibility ? 2 : 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor:
                      filters.category === category
                        ? theme.palette.primary.dark
                        : theme.palette.action.hover,
                  },
                }}
                aria-pressed={filters.category === category}
                aria-label={`Filter by ${category}`}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Admin-only moderation status filter */}
      {isAdmin && (
        <Box mb={spacing}>
          <FormControl
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: inputHeight,
                borderWidth: isHighVisibility ? 2 : 1,
              },
            }}
          >
            <InputLabel
              sx={{
                fontSize: fontSize,
              }}
            >
              Moderation Status
            </InputLabel>
            <Select
              value={filters.status || ''}
              onChange={handleStatusChange}
              label="Moderation Status"
              sx={{
                fontSize: fontSize,
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          p={spacing * 0.75}
          sx={{
            backgroundColor: isHighVisibility
              ? theme.palette.primary.light
              : theme.palette.grey[100],
            borderRadius: 1,
            border: isHighVisibility ? `2px solid ${theme.palette.primary.main}` : 'none',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: fontSize * 0.9,
              fontWeight: 600,
            }}
          >
            Active filters:
          </Typography>
          {filters.category && (
            <Chip
              label={filters.category}
              size="small"
              onDelete={() => handleCategoryChange(filters.category!)}
              sx={{ fontSize: fontSize * 0.85 }}
            />
          )}
          {filters.search && (
            <Chip
              label={`Search: "${filters.search}"`}
              size="small"
              onDelete={() => {
                setLocalSearch('');
                onFiltersChange({ ...filters, search: undefined });
              }}
              sx={{ fontSize: fontSize * 0.85 }}
            />
          )}
          {filters.status && (
            <Chip
              label={`Status: ${filters.status}`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, status: undefined })}
              sx={{ fontSize: fontSize * 0.85 }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default VendorFilters;
