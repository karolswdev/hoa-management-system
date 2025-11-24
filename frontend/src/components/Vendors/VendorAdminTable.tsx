import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Delete,
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import type { Vendor, VendorModerationState } from '../../types/api';

interface VendorAdminTableProps {
  vendors: Vendor[];
  selectedVendors: number[];
  onSelectionChange: (vendorIds: number[]) => void;
  onModerate: (vendorId: number, newState: VendorModerationState) => void;
  onDelete: (vendorId: number, vendorName: string) => void;
  currentTab: 'pending' | 'approved' | 'denied';
}

/**
 * VendorAdminTable Component
 *
 * Table component for admin vendor management with:
 * - Bulk selection checkboxes
 * - Individual moderation actions
 * - Delete functionality
 * - Responsive column visibility
 * - Accessibility support (high-vis mode, screen readers)
 *
 * Design:
 * - Checkbox column for bulk selection
 * - Name, category, contact, rating, created_by columns
 * - Actions column with approve/deny/delete buttons
 * - Color-coded status chips
 * - Tooltips for truncated text
 *
 * @example
 * ```tsx
 * <VendorAdminTable
 *   vendors={vendors}
 *   selectedVendors={[1, 2, 3]}
 *   onSelectionChange={setSelectedVendors}
 *   onModerate={handleModerate}
 *   onDelete={handleDelete}
 *   currentTab="pending"
 * />
 * ```
 */
const VendorAdminTable: React.FC<VendorAdminTableProps> = ({
  vendors,
  selectedVendors,
  onSelectionChange,
  onModerate,
  onDelete,
  currentTab,
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  // Handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = vendors.map((v) => v.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Handle individual selection
  const handleSelectOne = (vendorId: number) => {
    const currentIndex = selectedVendors.indexOf(vendorId);
    const newSelected = [...selectedVendors];

    if (currentIndex === -1) {
      newSelected.push(vendorId);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    onSelectionChange(newSelected);
  };

  const isSelected = (vendorId: number) => selectedVendors.indexOf(vendorId) !== -1;

  // Get visibility scope chip
  const getVisibilityScopeChip = (scope: string) => {
    const colorMap: Record<string, 'default' | 'primary' | 'success'> = {
      public: 'success',
      members: 'primary',
      admins: 'default',
    };

    return (
      <Chip
        label={scope}
        size="small"
        color={colorMap[scope] || 'default'}
        sx={{
          borderWidth: isHighVisibility ? 2 : 1,
          fontWeight: isHighVisibility ? 600 : 400,
        }}
      />
    );
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <TableContainer
      component={Paper}
      elevation={isHighVisibility ? 3 : 1}
      sx={{
        border: isHighVisibility ? `2px solid ${theme.palette.divider}` : 'none',
      }}
    >
      <Table aria-label="Vendor management table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedVendors.length > 0 && selectedVendors.length < vendors.length}
                checked={vendors.length > 0 && selectedVendors.length === vendors.length}
                onChange={handleSelectAll}
                inputProps={{
                  'aria-label': 'Select all vendors',
                }}
                sx={{
                  '& .MuiSvgIcon-root': {
                    fontSize: isHighVisibility ? 28 : 24,
                  },
                }}
              />
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Name
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Category
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Contact
              </Typography>
            </TableCell>
            <TableCell align="center">
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Rating
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Visibility
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Created
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" sx={{ fontWeight: isHighVisibility ? 700 : 600 }}>
                Actions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendors.map((vendor) => {
            const selected = isSelected(vendor.id);

            return (
              <TableRow
                key={vendor.id}
                hover
                selected={selected}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: isHighVisibility ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected}
                    onChange={() => handleSelectOne(vendor.id)}
                    inputProps={{
                      'aria-labelledby': `vendor-${vendor.id}-name`,
                    }}
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: isHighVisibility ? 28 : 24,
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    id={`vendor-${vendor.id}-name`}
                    variant="body2"
                    sx={{
                      fontWeight: isHighVisibility ? 600 : 400,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {vendor.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{vendor.service_category}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={vendor.contact_info || 'No contact info'} arrow>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {vendor.contact_info || '-'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {vendor.rating ? `${vendor.rating}/5` : '-'}
                  </Typography>
                </TableCell>
                <TableCell>{getVisibilityScopeChip(vendor.visibility_scope)}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(vendor.created_at)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={0.5} justifyContent="flex-end">
                    {/* Moderation actions based on current tab */}
                    {currentTab === 'pending' && (
                      <>
                        <Tooltip title="Approve vendor" arrow>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onModerate(vendor.id, 'approved')}
                            aria-label={`Approve ${vendor.name}`}
                            sx={{
                              minWidth: isHighVisibility ? 44 : 36,
                              minHeight: isHighVisibility ? 44 : 36,
                            }}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deny vendor" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onModerate(vendor.id, 'denied')}
                            aria-label={`Deny ${vendor.name}`}
                            sx={{
                              minWidth: isHighVisibility ? 44 : 36,
                              minHeight: isHighVisibility ? 44 : 36,
                            }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {currentTab === 'approved' && (
                      <Tooltip title="Move to denied" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onModerate(vendor.id, 'denied')}
                          aria-label={`Deny ${vendor.name}`}
                          sx={{
                            minWidth: isHighVisibility ? 44 : 36,
                            minHeight: isHighVisibility ? 44 : 36,
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {currentTab === 'denied' && (
                      <Tooltip title="Approve vendor" arrow>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onModerate(vendor.id, 'approved')}
                          aria-label={`Approve ${vendor.name}`}
                          sx={{
                            minWidth: isHighVisibility ? 44 : 36,
                            minHeight: isHighVisibility ? 44 : 36,
                          }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Delete action */}
                    <Tooltip title="Delete vendor" arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(vendor.id, vendor.name)}
                        aria-label={`Delete ${vendor.name}`}
                        sx={{
                          minWidth: isHighVisibility ? 44 : 36,
                          minHeight: isHighVisibility ? 44 : 36,
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VendorAdminTable;
