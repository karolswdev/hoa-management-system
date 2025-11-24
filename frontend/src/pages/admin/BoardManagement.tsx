import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  useTheme,
  IconButton,
} from '@mui/material';
import { Add, Close, Edit } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import FormHelper from '../../components/common/FormHelper';

/**
 * Board member roles
 */
export type BoardRole = 'President' | 'Vice President' | 'Secretary' | 'Treasurer' | 'Member at Large';

/**
 * Board member data structure
 */
export interface BoardMember {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: BoardRole;
  termStart: string; // ISO date string
  termEnd: string; // ISO date string
  bio?: string;
}

/**
 * Props for BoardManagementModal
 */
export interface BoardManagementModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback fired when the modal should close
   */
  onClose: () => void;

  /**
   * Callback fired when the form is submitted
   */
  onSubmit: (data: BoardMember) => void | Promise<void>;

  /**
   * Optional initial values for editing an existing member
   */
  initialValues?: Partial<BoardMember>;

  /**
   * Optional loading state
   */
  isLoading?: boolean;

  /**
   * Optional error message
   */
  error?: string;

  /**
   * Modal mode - add new or edit existing
   */
  mode?: 'add' | 'edit';
}

/**
 * BoardManagementModal Component
 *
 * An accessible modal for adding or editing board member information.
 * Implements high-visibility spacing, FormHelper integration, and proper
 * focus management.
 *
 * Accessibility Features:
 * - Focus trap within modal
 * - ESC key to close
 * - High-vis mode with increased field heights (48px → 56px)
 * - Contextual helpers for complex fields
 * - ARIA labels and descriptions
 * - Keyboard navigation support
 *
 * Design Tokens:
 * - Modal sizing: medium (640px max-width)
 * - Field heights: 48px standard, 56px high-vis
 * - Spacing: 4px base unit multiples
 * - Focus rings from theme
 *
 * @example
 * ```tsx
 * <BoardManagementModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={async (data) => {
 *     await saveBoardMember(data);
 *   }}
 *   mode="add"
 * />
 * ```
 */
const BoardManagementModal: React.FC<BoardManagementModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues = {},
  isLoading = false,
  error,
  mode = 'add',
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  const [formData, setFormData] = useState<BoardMember>({
    id: initialValues.id,
    name: initialValues.name || '',
    email: initialValues.email || '',
    phone: initialValues.phone || '',
    role: initialValues.role || 'Member at Large',
    termStart: initialValues.termStart || '',
    termEnd: initialValues.termEnd || '',
    bio: initialValues.bio || '',
  });

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof BoardMember, string>>>({});

  /**
   * Handle field changes
   */
  const handleChange = (field: keyof BoardMember) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  /**
   * Validate form data
   */
  const validate = (): boolean => {
    const errors: Partial<Record<keyof BoardMember, string>> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Role validation
    if (!formData.role) {
      errors.role = 'Role is required';
    }

    // Term dates validation
    if (!formData.termStart) {
      errors.termStart = 'Term start date is required';
    }

    if (!formData.termEnd) {
      errors.termEnd = 'Term end date is required';
    }

    if (formData.termStart && formData.termEnd) {
      const start = new Date(formData.termStart);
      const end = new Date(formData.termEnd);
      if (end <= start) {
        errors.termEnd = 'Term end date must be after start date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Calculate field height based on mode
  const fieldHeight = isHighVisibility ? 56 : 48;

  // Board role options
  const roleOptions: BoardRole[] = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Member at Large',
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="board-management-modal-title"
      aria-describedby="board-management-modal-description"
      // Focus trap and ESC to close handled by MUI Dialog
      disableEscapeKeyDown={isLoading}
      sx={{
        '& .MuiDialog-paper': {
          // Modal sizing from tokens (medium: 640px)
          maxWidth: 640,
          // Mobile margin from tokens (32px)
          margin: theme.spacing(4),
          // Border in high-vis mode
          border: isHighVisibility
            ? `2px solid ${theme.palette.primary.dark}`
            : 'none',
          // Border radius from theme
          borderRadius: theme.shape.borderRadius,
        },
      }}
    >
      <DialogTitle
        id="board-management-modal-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: theme.spacing(2),
        }}
      >
        <Typography variant="h2" component="span">
          {mode === 'add' ? 'Add Board Member' : 'Edit Board Member'}
        </Typography>
        <IconButton
          aria-label="Close modal"
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            minWidth: isHighVisibility ? 52 : 44,
            minHeight: isHighVisibility ? 52 : 44,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography
          id="board-management-modal-description"
          variant="body2"
          sx={{ mb: theme.spacing(3), color: theme.palette.text.secondary }}
        >
          {mode === 'add'
            ? 'Enter the details for the new board member below.'
            : 'Update the board member information below.'}
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" role="alert" sx={{ mb: theme.spacing(3) }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          id="board-member-form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3),
          }}
          noValidate
        >
          {/* Name Field */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-name"
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange('name')}
              error={Boolean(validationErrors.name)}
              helperText={validationErrors.name}
              required
              fullWidth
              disabled={isLoading}
              aria-describedby="board-member-name-help"
              inputProps={{
                'aria-label': 'Board member full name',
                'aria-required': 'true',
                'aria-invalid': Boolean(validationErrors.name),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: fieldHeight,
                },
              }}
            />
            <FormHelper
              helpText="Enter the board member's full legal name as it should appear in official documents and meeting minutes."
              ariaLabel="Help for name field"
              helpContentId="board-member-name-help"
              testId="name-helper"
            />
          </Box>

          {/* Email Field */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-email"
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={Boolean(validationErrors.email)}
              helperText={validationErrors.email}
              required
              fullWidth
              disabled={isLoading}
              aria-describedby="board-member-email-help"
              inputProps={{
                'aria-label': 'Board member email address',
                'aria-required': 'true',
                'aria-invalid': Boolean(validationErrors.email),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: fieldHeight,
                },
              }}
            />
            <FormHelper
              helpText="Provide the official email address for board communications. This will be visible to HOA members."
              ariaLabel="Help for email field"
              helpContentId="board-member-email-help"
              testId="email-helper"
            />
          </Box>

          {/* Phone Field */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-phone"
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={Boolean(validationErrors.phone)}
              helperText={validationErrors.phone}
              required
              fullWidth
              disabled={isLoading}
              aria-describedby="board-member-phone-help"
              inputProps={{
                'aria-label': 'Board member phone number',
                'aria-required': 'true',
                'aria-invalid': Boolean(validationErrors.phone),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: fieldHeight,
                },
              }}
            />
            <FormHelper
              helpText="Include area code and country code if applicable (e.g., +1-555-123-4567)."
              ariaLabel="Help for phone field"
              helpContentId="board-member-phone-help"
              testId="phone-helper"
            />
          </Box>

          {/* Role Field */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <FormControl
              fullWidth
              required
              error={Boolean(validationErrors.role)}
              disabled={isLoading}
            >
              <InputLabel id="board-member-role-label">Board Role</InputLabel>
              <Select
                labelId="board-member-role-label"
                id="board-member-role"
                name="role"
                value={formData.role}
                onChange={handleChange('role')}
                label="Board Role"
                aria-describedby="board-member-role-help"
                inputProps={{
                  'aria-label': 'Board member role',
                  'aria-required': 'true',
                  'aria-invalid': Boolean(validationErrors.role),
                }}
                sx={{
                  minHeight: fieldHeight,
                }}
              >
                {roleOptions.map(role => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.role && (
                <FormHelperText error>{validationErrors.role}</FormHelperText>
              )}
            </FormControl>
            <FormHelper
              helpText="Select the official board position. Roles determine voting rights and responsibilities per HOA bylaws."
              ariaLabel="Help for role field"
              helpContentId="board-member-role-help"
              testId="role-helper"
            />
          </Box>

          {/* Term Start Date */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-term-start"
              name="termStart"
              label="Term Start Date"
              type="date"
              value={formData.termStart}
              onChange={handleChange('termStart')}
              error={Boolean(validationErrors.termStart)}
              helperText={validationErrors.termStart}
              required
              fullWidth
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
              aria-describedby="board-member-term-start-help"
              inputProps={{
                'aria-label': 'Term start date',
                'aria-required': 'true',
                'aria-invalid': Boolean(validationErrors.termStart),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: fieldHeight,
                },
              }}
            />
            <FormHelper
              helpText="Enter the date when this board member's term officially begins."
              ariaLabel="Help for term start date field"
              helpContentId="board-member-term-start-help"
              testId="term-start-helper"
            />
          </Box>

          {/* Term End Date */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-term-end"
              name="termEnd"
              label="Term End Date"
              type="date"
              value={formData.termEnd}
              onChange={handleChange('termEnd')}
              error={Boolean(validationErrors.termEnd)}
              helperText={validationErrors.termEnd}
              required
              fullWidth
              disabled={isLoading}
              InputLabelProps={{ shrink: true }}
              aria-describedby="board-member-term-end-help"
              inputProps={{
                'aria-label': 'Term end date',
                'aria-required': 'true',
                'aria-invalid': Boolean(validationErrors.termEnd),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: fieldHeight,
                },
              }}
            />
            <FormHelper
              helpText="Enter the date when this board member's term officially ends. Must be after the start date."
              ariaLabel="Help for term end date field"
              helpContentId="board-member-term-end-help"
              testId="term-end-helper"
            />
          </Box>

          {/* Bio Field (Optional) */}
          <Box display="flex" alignItems="flex-start" gap={1}>
            <TextField
              id="board-member-bio"
              name="bio"
              label="Biography (Optional)"
              value={formData.bio}
              onChange={handleChange('bio')}
              fullWidth
              multiline
              rows={4}
              disabled={isLoading}
              aria-describedby="board-member-bio-help"
              inputProps={{
                'aria-label': 'Board member biography',
              }}
            />
            <FormHelper
              helpText="Add a brief biography highlighting relevant experience, qualifications, or community involvement."
              ariaLabel="Help for biography field"
              helpContentId="board-member-bio-help"
              testId="bio-helper"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          padding: theme.spacing(3),
          gap: theme.spacing(2),
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isLoading}
          sx={{
            minHeight: isHighVisibility ? 52 : 44,
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="board-member-form"
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={mode === 'add' ? <Add /> : <Edit />}
          sx={{
            minHeight: isHighVisibility ? 52 : 44,
          }}
        >
          {isLoading
            ? mode === 'add'
              ? 'Adding...'
              : 'Saving...'
            : mode === 'add'
            ? 'Add Member'
            : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardManagementModal;
