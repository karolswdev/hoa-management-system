import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Paper, Typography, Alert, Button, TextField } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { apiService } from '../../services/api';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const ResendVerificationPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (values: { email: string }) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiService.resendVerification(values.email);
      setSuccess(res.message || 'Verification email sent.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Unable to resend verification email.';
      setError(msg);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Resend Verification Email
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Formik initialValues={{ email: '' }} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field as={TextField}
                    name="email"
                    type="email"
                    label="Email Address"
                    fullWidth
                    error={touched.email && !!errors.email}
                    helperText={touched.email && errors.email}
                  />

                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Resend Email
                  </Button>

                  <Typography variant="body2">
                    Back to <Link to="/login">Login</Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResendVerificationPage;

