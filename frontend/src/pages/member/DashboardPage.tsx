import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Description as DocumentIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Announcement, Event } from '../../types/api';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent announcements
        const announcementsResponse = await apiService.getAnnouncements({
          limit: 5,
          status: 'active',
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
        
        // Fetch upcoming events
        const eventsResponse = await apiService.getEvents({
          status: 'upcoming',
          limit: 5,
          sortBy: 'event_date',
          sortOrder: 'asc',
        });

        setAnnouncements(announcementsResponse.data);
        setEvents(eventsResponse.data);
      } catch (err: any) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header with Visual Interest */}
      <Box sx={{
        mb: 4,
        p: 3,
        borderRadius: 2,
        background: (theme) => theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, rgba(0, 51, 102, 0.05) 0%, rgba(79, 107, 90, 0.05) 100%)'
          : 'rgba(0, 51, 102, 0.1)',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 179, 71, 0.1)',
          filter: 'blur(40px)',
        }
      }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', position: 'relative' }}>
          Welcome back, {user?.name}! 👋
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ position: 'relative' }}>
          Here's what's happening in your community.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid size={12}>
          <Card elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{
                  width: 6,
                  height: 24,
                  borderRadius: 1,
                  background: 'linear-gradient(to bottom, #003366, #FFB347)',
                }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<AnnouncementIcon />}
                  onClick={() => navigate('/announcements')}
                  sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
                >
                  View Announcements
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => navigate('/events')}
                  sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
                >
                  View Events
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DocumentIcon />}
                  onClick={() => navigate('/documents')}
                  sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
                >
                  Browse Documents
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ForumIcon />}
                  onClick={() => navigate('/discussions')}
                  sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
                >
                  Join Discussions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Announcements */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AnnouncementIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Recent Announcements
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/announcements')} sx={{ fontWeight: 'medium' }}>
                  View All →
                </Button>
              </Box>

              {announcements.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'text.secondary'
                }}>
                  <AnnouncementIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    No recent announcements
                  </Typography>
                  <Typography variant="body2">
                    Check back later for updates
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {announcements.map((announcement) => (
                    <Box
                      key={announcement.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(0, 51, 102, 0.02)',
                          transform: 'translateX(4px)',
                        }
                      }}
                      onClick={() => navigate('/announcements')}
                    >
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'semibold' }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {announcement.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon sx={{ color: 'secondary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Upcoming Events
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/events')} sx={{ fontWeight: 'medium' }}>
                  View All →
                </Button>
              </Box>

              {events.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'text.secondary'
                }}>
                  <EventIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    No upcoming events
                  </Typography>
                  <Typography variant="body2">
                    Stay tuned for community events
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {events.map((event) => (
                    <Box
                      key={event.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          backgroundColor: 'rgba(79, 107, 90, 0.02)',
                          transform: 'translateX(4px)',
                        }
                      }}
                      onClick={() => navigate('/events')}
                    >
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'semibold' }}>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {event.description.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          📍 {event.location}
                        </Typography>
                        <Chip
                          label={new Date(event.start_date).toLocaleDateString()}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 'medium' }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;