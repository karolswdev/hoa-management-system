import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Box,
  Alert,
  useTheme,
} from '@mui/material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';
import type { CreateVendorRequest, Vendor } from '../../types/api';
import FormHelper from '../common/FormHelper';

export interface VendorFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVendorRequest) => Promise<void>;
  categories?: string[];
  initialData?: Vendor;
  isEditing?: boolean;
  testId?: string;
}

/**
 * VendorForm Component
 *
 * Modal form for creating or editing vendor entries.
 * Gated by user role - only authenticated members can submit.
 *
 * Features:
 * - Role-based field visibility (admins see visibility_scope)
 * - Accessibility helpers for complex fields
 * - Form validation with error messages
 * - Rating input for members
 * - Contact info and notes fields
 * - Responsive layout
 * - High-visibility mode support
 *
 * @example Create new vendor
 * ```tsx
 * <VendorForm
 *   open={isOpen}
 *   onClose={handleClose}
 *   onSubmit={handleCreate}
 *   categories={categories}
 * />
 * ```
 *
 * @example Edit existing vendor
 * ```tsx
 * <VendorForm
 *   open={isOpen}
 *   onClose={handleClose}
 *   onSubmit={handleUpdate}
 *   initialData={vendor}
 *   isEditing
 * />
 * ```
 */
const VendorForm: React.FC<VendorFormProps> = ({
  open,
  onClose,
  onSubmit,
  categories = [],
  initialData,
  isEditing = false,
  testId,
}) => {
  const theme = useTheme();
  const { isHighVisibility, showHelpers } = useAccessibility();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Form state
  const [formData, setFormData] = useState<CreateVendorRequest>({
    name: initialData?.name || '',
    service_category: initialData?.service_category || '',
    contact_info: initialData?.contact_info || '',
    rating: initialData?.rating || undefined,
    notes: initialData?.notes || '',
    visibility_scope: initialData?.visibility_scope || 'members',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateVendorRequest, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculate spacing and sizing based on accessibility mode
  const spacing = isHighVisibility ? 2.5 : 2;
  const fontSize = isHighVisibility ? theme.typography.fontSize * 1.25 : theme.typography.fontSize;
  const inputHeight = isHighVisibility ? 52 : 44;

  const handleChange = (field: keyof CreateVendorRequest, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateVendorRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (!formData.service_category.trim()) {
      newErrors.service_category = 'Service category is required';
    }

    if (formData.rating !== undefined && formData.rating !== null) {
      if (formData.rating < 1 || formData.rating > 5) {
        newErrors.rating = 'Rating must be between 1 and 5';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean up empty fields
      const submitData: CreateVendorRequest = {
        name: formData.name.trim(),
        service_category: formData.service_category.trim(),
        contact_info: formData.contact_info?.trim() || undefined,
        rating: formData.rating,
        notes: formData.notes?.trim() || undefined,
        visibility_scope: formData.visibility_scope,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to submit vendor. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        service_category: '',
        contact_info: '',
        rating: undefined,
        notes: '',
        visibility_scope: 'members',
      });
      setErrors({});
      setSubmitError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid={testId}
      PaperProps={{
        sx: {
          border: isHighVisibility ? `2px solid ${theme.palette.primary.main}` : 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: fontSize * 1.3,
          fontWeight: isHighVisibility ? 700 : 600,
        }}
      >
        {isEditing ? 'Edit Vendor' : 'Submit New Vendor'}
      </DialogTitle>

      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: spacing }}>
            {submitError}
          </Alert>
        )}

        {!isEditing && (
          <Alert severity="info" sx={{ mb: spacing }}>
            {isAdmin
              ? 'As an admin, your submission will be immediately approved.'
              : 'Your vendor submission will be reviewed by an administrator before appearing in the directory.'}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={spacing} mt={spacing}>
          {/* Vendor name */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              required
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                sx: {
                  minHeight: inputHeight,
                  fontSize: fontSize,
                },
              }}
              InputLabelProps={{
                sx: { fontSize: fontSize },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: isHighVisibility ? 2 : 1,
                },
              }}
            />
            {showHelpers && (
              <FormHelper
                helpText="Enter the full business name of the vendor as it should appear in the directory."
                ariaLabel="Help for vendor name"
                helpContentId="vendor-name-help"
              />
            )}
          </Box>

          {/* Service category */}
          <Box display="flex" alignItems="center" gap={1}>
            <FormControl
              fullWidth
              required
              error={!!errors.service_category}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: inputHeight,
                  borderWidth: isHighVisibility ? 2 : 1,
                },
              }}
            >
              <InputLabel id="service-category-label" sx={{ fontSize: fontSize }}>Service Category</InputLabel>
              <Select
                labelId="service-category-label"
                id="service-category-select"
                value={formData.service_category}
                onChange={(e) => handleChange('service_category', e.target.value)}
                label="Service Category"
                sx={{ fontSize: fontSize }}
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="Plumbing">Plumbing</MenuItem>
                    <MenuItem value="Electrical">Electrical</MenuItem>
                    <MenuItem value="Landscaping">Landscaping</MenuItem>
                    <MenuItem value="HVAC">HVAC</MenuItem>
                    <MenuItem value="Roofing">Roofing</MenuItem>
                    <MenuItem value="Painting">Painting</MenuItem>
                    <MenuItem value="General Contractor">General Contractor</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </>
                )}
              </Select>
              {errors.service_category && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.service_category}
                </Typography>
              )}
            </FormControl>
            {showHelpers && (
              <FormHelper
                helpText="Select the primary service category for this vendor. Choose the most specific category that applies."
                ariaLabel="Help for service category"
                helpContentId="vendor-category-help"
              />
            )}
          </Box>

          {/* Contact info */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              label="Contact Information"
              value={formData.contact_info}
              onChange={(e) => handleChange('contact_info', e.target.value)}
              multiline
              rows={2}
              placeholder="Phone: (555) 123-4567, Email: contact@vendor.com"
              InputProps={{
                sx: { fontSize: fontSize },
              }}
              InputLabelProps={{
                sx: { fontSize: fontSize },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: isHighVisibility ? 2 : 1,
                },
              }}
            />
            {showHelpers && (
              <FormHelper
                helpText="Enter contact details like phone number and email. This information will only be visible to authenticated members."
                ariaLabel="Help for contact information"
                helpContentId="vendor-contact-help"
              />
            )}
          </Box>

          {/* Rating */}
          <Box>
            <Typography
              variant="body2"
              sx={{ fontSize: fontSize * 0.95, mb: 1 }}
            >
              Rating (optional)
            </Typography>
            <Box display="flex" alignItems="center" gap={spacing}>
              <Rating
                value={formData.rating || 0}
                onChange={(_, newValue) => handleChange('rating', newValue)}
                size={isHighVisibility ? 'large' : 'medium'}
              />
              {formData.rating && (
                <Typography variant="body2" sx={{ fontSize: fontSize * 0.9 }}>
                  {formData.rating}/5
                </Typography>
              )}
              {showHelpers && (
                <FormHelper
                  helpText="Rate this vendor based on your experience from 1 (poor) to 5 (excellent). This rating will be visible to other members."
                  ariaLabel="Help for rating"
                  helpContentId="vendor-rating-help"
                />
              )}
            </Box>
            {errors.rating && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.rating}
              </Typography>
            )}
          </Box>

          {/* Notes */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              multiline
              rows={3}
              placeholder="Additional information about this vendor..."
              InputProps={{
                sx: { fontSize: fontSize },
              }}
              InputLabelProps={{
                sx: { fontSize: fontSize },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderWidth: isHighVisibility ? 2 : 1,
                },
              }}
            />
            {showHelpers && (
              <FormHelper
                helpText="Add any additional notes or comments about this vendor, such as services offered, pricing, or quality of work."
                ariaLabel="Help for notes"
                helpContentId="vendor-notes-help"
              />
            )}
          </Box>

          {/* Visibility scope (admin only) */}
          {isAdmin && (
            <FormControl
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: inputHeight,
                  borderWidth: isHighVisibility ? 2 : 1,
                },
              }}
            >
              <InputLabel sx={{ fontSize: fontSize }}>Visibility Scope</InputLabel>
              <Select
                value={formData.visibility_scope}
                onChange={(e) => handleChange('visibility_scope', e.target.value)}
                label="Visibility Scope"
                sx={{ fontSize: fontSize }}
              >
                <MenuItem value="public">Public (visible to guests)</MenuItem>
                <MenuItem value="members">Members Only</MenuItem>
                <MenuItem value="admins">Admins Only</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: spacing }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          variant={isHighVisibility ? 'outlined' : 'text'}
          sx={{
            minHeight: inputHeight,
            fontSize: fontSize,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="contained"
          sx={{
            minHeight: inputHeight,
            fontSize: fontSize,
          }}
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Save Changes' : 'Submit for Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorForm;
