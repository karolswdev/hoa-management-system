import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { apiService } from '../../services/api';
import type { Config, UpdateConfigRequest } from '../../types/api';

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'email' | 'url';
  required?: boolean;
  maxLength?: number;
}

const configFields: ConfigField[] = [
  {
    key: 'hoa_name',
    label: 'HOA Name',
    description: 'The official name of your Homeowners Association',
    type: 'text',
    required: true,
    maxLength: 200,
  },
  {
    key: 'hoa_description',
    label: 'HOA Description',
    description: 'A brief description of your HOA community',
    type: 'textarea',
    maxLength: 1000,
  },
  {
    key: 'contact_email',
    label: 'Contact Email',
    description: 'Primary contact email for the HOA',
    type: 'email',
    required: true,
    maxLength: 100,
  },
  {
    key: 'contact_phone',
    label: 'Contact Phone',
    description: 'Primary contact phone number for the HOA',
    type: 'text',
    maxLength: 20,
  },
  {
    key: 'address',
    label: 'HOA Address',
    description: 'Physical address of the HOA office or community',
    type: 'textarea',
    maxLength: 500,
  },
  {
    key: 'website_url',
    label: 'Website URL',
    description: 'Official website URL (if any)',
    type: 'url',
    maxLength: 200,
  },
  {
    key: 'office_hours',
    label: 'Office Hours',
    description: 'HOA office hours or availability',
    type: 'textarea',
    maxLength: 200,
  },
  {
    key: 'emergency_contact',
    label: 'Emergency Contact',
    description: 'Emergency contact information',
    type: 'textarea',
    maxLength: 500,
  },
  {
    key: 'discussion_code_of_conduct',
    label: 'Community Discussions Code of Conduct',
    description: 'Code of conduct that members must accept before using community discussions. Updating this will require all members to accept the new version.',
    type: 'textarea',
    maxLength: 5000,
    required: false,
  },
];

const AdminConfigPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [config, setConfig] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // State for form values
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // Load configuration data
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: Config = await apiService.getConfig();
      setConfig(response);
      
      // Initialize form values
      const initialValues: Record<string, string> = {};
      configFields.forEach(field => {
        initialValues[field.key] = response[field.key] || '';
      });
      setFormValues(initialValues);
      setHasChanges({});
      
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to load configuration';
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Handle form value changes
  const handleValueChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setHasChanges(prev => ({ ...prev, [key]: value !== (config[key] || '') }));
    
    // Clear error for this field
    if (formErrors[key]) {
      setFormErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Validate field
  const validateField = (field: ConfigField, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }
    
    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} must be less than ${field.maxLength} characters`;
    }
    
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
      return 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    return '';
  };

  // Handle save configuration
  const handleSaveConfig = async (field: ConfigField) => {
    const value = formValues[field.key] || '';
    const error = validateField(field, value);
    
    if (error) {
      setFormErrors(prev => ({ ...prev, [field.key]: error }));
      return;
    }
    
    try {
      setSaving(prev => ({ ...prev, [field.key]: true }));
      
      const data: UpdateConfigRequest = { value: value.trim() };
      await apiService.updateConfig(field.key, data);
      
      // Update local config
      setConfig(prev => ({ ...prev, [field.key]: value.trim() }));
      setHasChanges(prev => ({ ...prev, [field.key]: false }));
      
      enqueueSnackbar(`${field.label} updated successfully`, { variant: 'success' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        `Failed to update ${field.label}`;
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSaving(prev => ({ ...prev, [field.key]: false }));
    }
  };

  // Handle save all changes
  const handleSaveAll = async () => {
    const fieldsWithChanges = configFields.filter(field => hasChanges[field.key]);
    
    if (fieldsWithChanges.length === 0) {
      enqueueSnackbar('No changes to save', { variant: 'info' });
      return;
    }
    
    // Validate all changed fields
    const errors: Record<string, string> = {};
    fieldsWithChanges.forEach(field => {
      const error = validateField(field, formValues[field.key] || '');
      if (error) {
        errors[field.key] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      enqueueSnackbar('Please fix validation errors before saving', { variant: 'error' });
      return;
    }
    
    // Save all changes
    try {
      setSaving({ all: true });
      
      for (const field of fieldsWithChanges) {
        const value = formValues[field.key] || '';
        const data: UpdateConfigRequest = { value: value.trim() };
        await apiService.updateConfig(field.key, data);
        
        // Update local config
        setConfig(prev => ({ ...prev, [field.key]: value.trim() }));
      }
      
      setHasChanges({});
      enqueueSnackbar('All settings saved successfully', { variant: 'success' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to save settings';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setSaving({});
    }
  };

  // Reset field to original value
  const handleResetField = (field: ConfigField) => {
    const originalValue = config[field.key] || '';
    setFormValues(prev => ({ ...prev, [field.key]: originalValue }));
    setHasChanges(prev => ({ ...prev, [field.key]: false }));
    setFormErrors(prev => ({ ...prev, [field.key]: '' }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadConfig}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const totalChanges = Object.values(hasChanges).filter(Boolean).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage HOA system settings and information
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadConfig}
            disabled={Object.values(saving).some(Boolean)}
          >
            Refresh
          </Button>
          
          {totalChanges > 0 && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={saving.all}
            >
              Save All Changes ({totalChanges})
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {configFields.map((field) => (
          <Grid key={field.key} size={{ xs: 12, md: 6 }}>
            <Card elevation={1}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SettingsIcon color="primary" />
                  <Typography variant="h6">
                    {field.label}
                    {field.required && <span style={{ color: 'red' }}> *</span>}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {field.description}
                </Typography>
                
                <TextField
                  fullWidth
                  label={field.label}
                  value={formValues[field.key] || ''}
                  onChange={(e) => handleValueChange(field.key, e.target.value)}
                  error={!!formErrors[field.key]}
                  helperText={
                    formErrors[field.key] || 
                    (field.maxLength ? `${(formValues[field.key] || '').length}/${field.maxLength} characters` : '')
                  }
                  multiline={field.type === 'textarea'}
                  rows={field.type === 'textarea' ? 3 : 1}
                  type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                  required={field.required}
                  disabled={saving[field.key]}
                />
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                  {hasChanges[field.key] && (
                    <Typography variant="caption" color="warning.main">
                      Unsaved changes
                    </Typography>
                  )}
                </Box>
                
                <Box display="flex" gap={1}>
                  {hasChanges[field.key] && (
                    <Button
                      size="small"
                      onClick={() => handleResetField(field)}
                      disabled={saving[field.key]}
                    >
                      Reset
                    </Button>
                  )}
                  
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={saving[field.key] ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={() => handleSaveConfig(field)}
                    disabled={saving[field.key] || !hasChanges[field.key]}
                  >
                    {saving[field.key] ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminConfigPage;
