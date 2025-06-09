import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../types/api';

// Validation schemas
const editProfileSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

const changePasswordSchema = Yup.object({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditProfile = async (values: UpdateProfileRequest) => {
    setIsLoading(true);
    try {
      const updatedUser = await apiService.updateProfile(values);
      updateUser(updatedUser);
      showSuccess('Profile updated successfully!');
      setEditDialogOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to update profile. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (values: ChangePasswordRequest) => {
    setIsLoading(true);
    try {
      await apiService.changePassword(values);
      showSuccess('Password changed successfully!');
      setPasswordDialogOpen(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to change password. Please try again.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'member':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Box>
        <Alert severity="error">
          Unable to load user information. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* User Information Card */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {user.name}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Role
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                
                {user.created_at && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Actions Card */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Actions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit Profile
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <Formik
          initialValues={{
            name: user.name,
          }}
          validationSchema={editProfileSchema}
          onSubmit={handleEditProfile}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  name="name"
                  label="Name"
                  fullWidth
                  margin="normal"
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }}
          validationSchema={changePasswordSchema}
          onSubmit={handleChangePassword}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  name="currentPassword"
                  type="password"
                  label="Current Password"
                  fullWidth
                  margin="normal"
                  error={touched.currentPassword && !!errors.currentPassword}
                  helperText={touched.currentPassword && errors.currentPassword}
                />
                
                <Field
                  as={TextField}
                  name="newPassword"
                  type="password"
                  label="New Password"
                  fullWidth
                  margin="normal"
                  error={touched.newPassword && !!errors.newPassword}
                  helperText={touched.newPassword && errors.newPassword}
                />
                
                <Field
                  as={TextField}
                  name="confirmPassword"
                  type="password"
                  label="Confirm New Password"
                  fullWidth
                  margin="normal"
                  error={touched.confirmPassword && !!errors.confirmPassword}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => setPasswordDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
