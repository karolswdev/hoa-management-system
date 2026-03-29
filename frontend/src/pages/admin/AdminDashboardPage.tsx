import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  People,
  Announcement,
  Event,
  Description,
  Store,
  Groups,
  Architecture,
  Settings,
  History,
} from '@mui/icons-material';
import { apiService } from '../../services/api';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, vendors] = await Promise.allSettled([
          apiService.getUsers({ limit: 1, offset: 0 }),
          apiService.getVendorStats(),
        ]);

        const userCount = users.status === 'fulfilled' ? users.value.count : '-';
        const pendingVendors = vendors.status === 'fulfilled'
          ? vendors.value.stats.byModerationState.find((s: { state: string }) => s.state === 'pending')?.count ?? 0
          : '-';

        setStats([
          { label: 'Total Users', value: userCount, icon: <People />, path: '/admin/users', color: 'primary.main' },
          { label: 'Pending Vendors', value: pendingVendors, icon: <Store />, path: '/admin/vendors', color: 'warning.main' },
        ]);
      } catch {
        // Stats are best-effort
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const quickLinks = [
    { label: 'User Management', description: 'Approve registrations and manage accounts', icon: <People />, path: '/admin/users' },
    { label: 'Announcements', description: 'Post news and updates for residents', icon: <Announcement />, path: '/admin/announcements' },
    { label: 'Events', description: 'Create and manage community events', icon: <Event />, path: '/admin/events' },
    { label: 'Documents', description: 'Upload and approve shared documents', icon: <Description />, path: '/admin/documents' },
    { label: 'Vendor Management', description: 'Review and moderate vendor submissions', icon: <Store />, path: '/admin/vendors' },
    { label: 'Committees', description: 'Manage review committees and members', icon: <Groups />, path: '/admin/committees' },
    { label: 'Request Categories', description: 'Configure architectural review categories', icon: <Architecture />, path: '/admin/arc-categories' },
    { label: 'Site Configuration', description: 'Update HOA name, contact info, and settings', icon: <Settings />, path: '/admin/config' },
    { label: 'Audit Logs', description: 'View system activity and admin actions', icon: <History />, path: '/admin/audit' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your community portal. Use the links below or the sidebar to navigate.
        </Typography>
      </Box>

      {/* Stats cards */}
      {(loading || stats.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {loading
            ? [1, 2].map((i) => (
                <Grid key={i} size={{ xs: 6, sm: 3 }}>
                  <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2 }} />
                </Grid>
              ))
            : stats.map((stat) => (
                <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate(stat.path)}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>
      )}

      {/* Quick links grid */}
      <Grid container spacing={2}>
        {quickLinks.map((link) => (
          <Grid key={link.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea onClick={() => navigate(link.path)} sx={{ height: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ color: 'primary.main', mt: 0.25 }}>{link.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2">{link.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboardPage;
