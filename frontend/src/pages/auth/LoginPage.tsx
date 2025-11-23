import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import type { LoginRequest } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import ReleaseBadge from '../../components/common/ReleaseBadge';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (values: LoginRequest) => {
    setError('');
    setIsLoading(true);

    try {
      await login(values);
      showSuccess('Welcome back! You have successfully signed in.');
      navigate(from, { replace: true });
    } catch (err: any) {
      // Backend returns errors in { error: "message" } format
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Login failed. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
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
              Sign In
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={{
              email: '',
              password: '',
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

                  <Field
                    as={TextField}
                    name="password"
                    type="password"
                    label="Password"
                    fullWidth
                    autoComplete="current-password"
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || isSubmitting}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">
              <Link 
                to="/forgot-password" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                Forgot your password?
              </Link>
            </Typography>
            <Typography variant="body2">
              Didn't receive your verification email?{' '}
              <Link
                to="/resend-verification"
                style={{ textDecoration: 'none', fontWeight: 'bold' }}
              >
                Resend verification
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

            <Typography variant="body2" color="text.secondary">
              <Link 
                to="/public" 
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                View public information
              </Link>
            </Typography>
            <ReleaseBadge />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
