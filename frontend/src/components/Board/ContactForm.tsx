import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  useTheme,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import FormHelper from '../common/FormHelper';

/**
 * Contact form data structure
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Props for ContactForm component
 */
export interface ContactFormProps {
  /**
   * Callback fired when the form is submitted
   */
  onSubmit: (data: ContactFormData) => void | Promise<void>;

  /**
   * Optional initial values for the form
   */
  initialValues?: Partial<ContactFormData>;

  /**
   * Optional loading state to disable form during submission
   */
  isLoading?: boolean;

  /**
   * Optional error message to display
   */
  error?: string;

  /**
   * Optional success message to display
   */
  success?: string;
}

/**
 * Board ContactForm Component
 *
 * A form for contacting board members with accessibility features including:
 * - High-visibility mode support with increased field heights (48px → 56px)
 * - Contextual help icons via FormHelper (when showHelpers is enabled)
 * - WCAG 2.1 AA compliant contrast and spacing
 * - Full keyboard navigation support
 * - Validation with accessible error messages
 *
 * Design Features:
 * - Uses theme spacing tokens (4px multiples)
 * - Field heights: 48px standard, 56px high-vis
 * - Label spacing: 4px standard, 8px high-vis
 * - Focus rings from theme tokens
 * - Helper icons appear only when accessibility helpers are enabled
 *
 * @example
 * ```tsx
 * <ContactForm
 *   onSubmit={async (data) => {
 *     await sendEmail(data);
 *   }}
 *   isLoading={false}
 * />
 * ```
 */
const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  initialValues = {},
  isLoading = false,
  error,
  success,
}) => {
  const theme = useTheme();
  const { isHighVisibility } = useAccessibility();

  const [formData, setFormData] = useState<ContactFormData>({
    name: initialValues.name || '',
    email: initialValues.email || '',
    subject: initialValues.subject || '',
    message: initialValues.message || '',
  });

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  /**
   * Handle field changes
   */
  const handleChange = (field: keyof ContactFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
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
    const errors: Partial<Record<keyof ContactFormData, string>> = {};

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

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 10) {
      errors.subject = 'Subject must be at least 10 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 20) {
      errors.message = 'Message must be at least 20 characters';
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

  // Calculate field height based on mode (tokens.json)
  const fieldHeight = isHighVisibility ? 56 : 48;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3), // 12px gap between fields
        maxWidth: 640, // Medium modal size from tokens
        width: '100%',
      }}
      noValidate
      aria-label="Board contact form"
    >
      <Typography
        variant="h2"
        component="h1"
        sx={{
          mb: theme.spacing(2),
        }}
      >
        Contact Board Members
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" role="alert">
          {success}
        </Alert>
      )}

      {/* Name Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-name"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={Boolean(validationErrors.name)}
          helperText={validationErrors.name}
          required
          fullWidth
          disabled={isLoading}
          aria-describedby="contact-name-help"
          inputProps={{
            'aria-label': 'Full name',
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
          helpText="Enter your full legal name as it appears on official HOA documents."
          ariaLabel="Help for full name field"
          helpContentId="contact-name-help"
          testId="name-helper"
        />
      </Box>

      {/* Email Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-email"
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
          aria-describedby="contact-email-help"
          inputProps={{
            'aria-label': 'Email address',
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
          helpText="Provide a valid email address where the board can respond to your inquiry."
          ariaLabel="Help for email field"
          helpContentId="contact-email-help"
          testId="email-helper"
        />
      </Box>

      {/* Subject Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-subject"
          name="subject"
          label="Subject"
          value={formData.subject}
          onChange={handleChange('subject')}
          error={Boolean(validationErrors.subject)}
          helperText={validationErrors.subject || 'Minimum 10 characters'}
          required
          fullWidth
          disabled={isLoading}
          aria-describedby="contact-subject-help"
          inputProps={{
            'aria-label': 'Message subject',
            'aria-required': 'true',
            'aria-invalid': Boolean(validationErrors.subject),
            minLength: 10,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              minHeight: fieldHeight,
            },
          }}
        />
        <FormHelper
          helpText="Briefly summarize your inquiry or concern (minimum 10 characters)."
          ariaLabel="Help for subject field"
          helpContentId="contact-subject-help"
          testId="subject-helper"
        />
      </Box>

      {/* Message Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-message"
          name="message"
          label="Message"
          value={formData.message}
          onChange={handleChange('message')}
          error={Boolean(validationErrors.message)}
          helperText={validationErrors.message || 'Minimum 20 characters'}
          required
          fullWidth
          multiline
          rows={6}
          disabled={isLoading}
          aria-describedby="contact-message-help"
          inputProps={{
            'aria-label': 'Message content',
            'aria-required': 'true',
            'aria-invalid': Boolean(validationErrors.message),
            minLength: 20,
          }}
        />
        <FormHelper
          helpText="Provide detailed information about your inquiry, including relevant dates, locations, or policy references."
          ariaLabel="Help for message field"
          helpContentId="contact-message-help"
          testId="message-helper"
        />
      </Box>

      {/* Submit Button */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={<Send />}
          sx={{
            minHeight: isHighVisibility ? 52 : 44, // Button sizing from tokens
          }}
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </Box>
  );
};

export default ContactForm;
