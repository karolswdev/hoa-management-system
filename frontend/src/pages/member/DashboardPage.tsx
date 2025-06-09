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
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's what's happening in your community.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<AnnouncementIcon />}
                  onClick={() => navigate('/announcements')}
                >
                  View Announcements
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => navigate('/events')}
                >
                  View Events
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DocumentIcon />}
                  onClick={() => navigate('/documents')}
                >
                  Browse Documents
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ForumIcon />}
                  onClick={() => navigate('/discussions')}
                >
                  Join Discussions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Announcements */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Announcements
                </Typography>
                <Button size="small" onClick={() => navigate('/announcements')}>
                  View All
                </Button>
              </Box>
              
              {announcements.length === 0 ? (
                <Typography color="text.secondary">
                  No recent announcements
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {announcements.map((announcement) => (
                    <Box key={announcement.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
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
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Upcoming Events
                </Typography>
                <Button size="small" onClick={() => navigate('/events')}>
                  View All
                </Button>
              </Box>
              
              {events.length === 0 ? (
                <Typography color="text.secondary">
                  No upcoming events
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {events.map((event) => (
                    <Box key={event.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {event.description.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {event.location}
                        </Typography>
                        <Chip 
                          label={new Date(event.start_date).toLocaleDateString()} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
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