import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  Container,
  Paper,
  Button,
} from '@mui/material';
import {
  HourglassEmpty as PendingIcon,
  Block as RejectedIcon,
} from '@mui/icons-material';
import type { User } from '../../types/api';

interface AccountStatusPageProps {
  user: User;
}

const AccountStatusPage: React.FC<AccountStatusPageProps> = ({ user }) => {
  const isPending = user.status === 'pending';
  const isRejected = user.status === 'rejected';

  const getStatusInfo = () => {
    if (isPending) {
      return {
        icon: <PendingIcon sx={{ fontSize: 64, color: 'warning.main' }} />,
        title: 'Account Pending Approval',
        message: 'Your account has been created successfully and is currently pending approval from an administrator.',
        details: 'You will receive an email notification once your account has been approved. This process typically takes 1-2 business days.',
        severity: 'warning' as const,
      };
    }

    if (isRejected) {
      return {
        icon: <RejectedIcon sx={{ fontSize: 64, color: 'error.main' }} />,
        title: 'Account Access Denied',
        message: 'Your account application has been reviewed and unfortunately cannot be approved at this time.',
        details: 'If you believe this is an error or would like to appeal this decision, please contact the HOA administration directly.',
        severity: 'error' as const,
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  return (
    <Container component="main" maxWidth="md">
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
            <Box sx={{ mb: 3 }}>
              {statusInfo.icon}
            </Box>
            <Typography component="h1" variant="h4" gutterBottom>
              {statusInfo.title}
            </Typography>
          </Box>

          <Alert severity={statusInfo.severity} sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Hello, {user.name}!</strong>
            </Typography>
            <Typography variant="body1" gutterBottom>
              {statusInfo.message}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {statusInfo.details}
            </Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Account Status: <strong>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email: {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Account Created: {new Date(user.created_at).toLocaleDateString()}
            </Typography>

            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AccountStatusPage;