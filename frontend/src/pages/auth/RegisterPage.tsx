import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
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
import type { RegisterRequest } from '../../types/api';
import TurnstileWidget from '../../components/auth/TurnstileWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(1, 'Name is required')
    .required('Name is required'),
  email: Yup.string()
    .trim()
    .email('Email must be a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
      'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Password confirmation must match password')
    .required('Password confirmation is required'),
});

const RegisterPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const { register } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterRequest & { confirmPassword: string; captchaToken?: string }) => {
    setError('');
    setIsLoading(true);

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, captchaToken, ...registerData } = values;
      const payload: any = { ...registerData };
      if (captchaToken) payload.captchaToken = captchaToken;
      await register(payload);
      
      showSuccess('Registration successful. Please verify your email and wait for admin approval.');
      navigate('/login');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('An account with this email address already exists.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
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
              Create Account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              captchaToken: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, setFieldValue, values }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Full Name"
                    fullWidth
                    autoComplete="name"
                    autoFocus
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                  />

                  <Field
                    as={TextField}
                    name="email"
                    type="email"
                    label="Email Address"
                    fullWidth
                    autoComplete="email"
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                  />

                  <Field
                    as={TextField}
                    name="password"
                    type="password"
                    label="Password"
                    fullWidth
                    autoComplete="new-password"
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                  />

                  <Field
                    as={TextField}
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    fullWidth
                    autoComplete="new-password"
                    error={touched.confirmPassword && !!errors.confirmPassword}
                    helperText={touched.confirmPassword && errors.confirmPassword}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || isSubmitting || (!!siteKey && !values.captchaToken)}
                    sx={{ mt: 2 }}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  {siteKey && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        This site is protected by Turnstile and the Cloudflare Privacy Policy applies.
                      </Typography>
                      <TurnstileWidget
                        siteKey={siteKey}
                        onToken={(t) => setFieldValue('captchaToken', t)}
                        onExpire={() => setFieldValue('captchaToken', '')}
                      />
                    </Box>
                  )}
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
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

export default RegisterPage;
