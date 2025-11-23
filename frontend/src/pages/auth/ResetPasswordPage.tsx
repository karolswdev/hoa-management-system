import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import type { ResetPasswordRequest } from '../../types/api';
import { apiService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
      'Password must include uppercase, lowercase, number, and special character'
    )
    .required('New password is required'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Password confirmation must match password')
    .required('Password confirmation is required'),
});

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string>('');
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (values: { newPassword: string; confirmNewPassword: string }) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const resetData: ResetPasswordRequest = {
        token,
        newPassword: values.newPassword,
      };
      
      await apiService.resetPassword(resetData);
      showSuccess('Password has been reset successfully. You can now sign in with your new password.');
      navigate('/login');
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError('Invalid or expired reset token. Please request a new password reset.');
      } else {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              HOA Community Hub
            </Typography>
            <Typography variant="h5" color="text.secondary">
              Set New Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Enter your new password below.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {token && (
            <Formik
              initialValues={{
                newPassword: '',
                confirmNewPassword: '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Field
                      as={TextField}
                      name="newPassword"
                      type="password"
                      label="New Password"
                      fullWidth
                      autoComplete="new-password"
                      autoFocus
                      error={touched.newPassword && !!errors.newPassword}
                      helperText={touched.newPassword && errors.newPassword}
                    />

                    <Field
                      as={TextField}
                      name="confirmNewPassword"
                      type="password"
                      label="Confirm New Password"
                      fullWidth
                      autoComplete="new-password"
                      error={touched.confirmNewPassword && !!errors.confirmNewPassword}
                      helperText={touched.confirmNewPassword && errors.confirmNewPassword}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading || isSubmitting}
                      sx={{ mt: 2 }}
                    >
                      {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link
                to="/login"
                style={{ textDecoration: 'none', fontWeight: 'bold' }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;
