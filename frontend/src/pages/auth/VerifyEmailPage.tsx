import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, Alert, Button, CircularProgress } from '@mui/material';
import { apiService } from '../../services/api';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const res = await apiService.verifyEmail(token);
        if (!mounted) return;
        setMessage(res.message || 'Email verified successfully.');
      } catch (err: any) {
        if (!mounted) return;
        const msg = err.response?.data?.error || 'Invalid or expired verification link.';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (token) run();
    else {
      setError('Missing verification token.');
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [token]);

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Email Verification
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {!loading && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
              <Button component={Link} to="/public">View Public Info</Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmailPage;

