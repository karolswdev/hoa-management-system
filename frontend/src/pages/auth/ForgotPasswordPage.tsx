import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import type { ForgotPasswordRequest } from '../../types/api';
import { apiService } from '../../services/api';

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Email must be a valid email address')
    .required('Email is required'),
});

const ForgotPasswordPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: ForgotPasswordRequest) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiService.forgotPassword(values);
      setSuccess('If an account with that email exists, a password reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Formik
            initialValues={{
              email: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Field
                    as={TextField}
                    name="email"
                    type="email"
                    label="Email Address"
                    fullWidth
                    autoComplete="email"
                    autoFocus
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || isSubmitting}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link
                to="/login"
                style={{ textDecoration: 'none', fontWeight: 'bold' }}
              >
                Sign in here
              </Link>
            </Typography>
            
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{ textDecoration: 'none', fontWeight: 'bold' }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;