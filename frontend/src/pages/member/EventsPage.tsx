import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Pagination,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import { CalendarToday, LocationOn, Person } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';
import type { Event, PaginatedResponse } from '../../types/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`events-tabpanel-${index}`}
      aria-labelledby={`events-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabValue, setTabValue] = useState(0); // 0 = Upcoming, 1 = Past
  const { showError } = useNotification();

  const itemsPerPage = 10;

  const fetchEvents = async (page: number = 1, isUpcoming: boolean = true) => {
    setLoading(true);
    setError('');
    
    try {
      const response: PaginatedResponse<Event> = await apiService.getEvents({
        status: isUpcoming ? 'upcoming' : 'past',
        page,
        limit: itemsPerPage,
        sortBy: 'event_date',
        sortOrder: isUpcoming ? 'asc' : 'desc', // Upcoming: earliest first, Past: latest first
      });

      setEvents(response.data);
      setTotalCount(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to load events. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, tabValue === 0);
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    fetchEvents(page, tabValue === 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Same day event
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(startDate)} • ${formatTime(startDate)} - ${formatTime(endDate)}`;
    }
    
    // Multi-day event
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const isEventPast = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Events
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Events
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="event filter tabs">
          <Tab label="Upcoming Events" id="events-tab-0" aria-controls="events-tabpanel-0" />
          <Tab label="Past Events" id="events-tab-1" aria-controls="events-tabpanel-1" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No upcoming events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are currently no upcoming events scheduled.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Showing {events.length} of {totalCount} upcoming events
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {events.map((event) => (
                <Card key={event.id} elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h5" component="h2" gutterBottom>
                        {event.title}
                      </Typography>
                      <Chip 
                        label="Upcoming"
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDateRange(event.start_date, event.end_date)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {event.location}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Organized by {event.creator?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {event.description}
                    </Typography>

                    {event.updated_at !== event.created_at && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {formatDate(event.updated_at)}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No past events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no past events to display.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Showing {events.length} of {totalCount} past events
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {events.map((event) => (
                <Card key={event.id} elevation={2} sx={{ opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h5" component="h2" gutterBottom>
                        {event.title}
                      </Typography>
                      <Chip 
                        label="Past"
                        color="default"
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDateRange(event.start_date, event.end_date)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {event.location}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Organized by {event.creator?.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {event.description}
                    </Typography>

                    {event.updated_at !== event.created_at && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {formatDate(event.updated_at)}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>
    </Box>
  );
};

export default EventsPage;