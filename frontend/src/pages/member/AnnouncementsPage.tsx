import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Pagination,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';
import type { Announcement, PaginatedResponse } from '../../types/api';

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { showError } = useNotification();

  const itemsPerPage = 10;

  const fetchAnnouncements = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const response: PaginatedResponse<Announcement> = await apiService.getAnnouncements({
        page,
        limit: itemsPerPage,
        status: 'active', // Only fetch active announcements
        sortBy: 'created_at',
        sortOrder: 'desc', // Most recent first
      });

      setAnnouncements(response.data);
      setTotalCount(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(page);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message ||
        'Failed to load announcements. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, showError]);

  useEffect(() => {
    fetchAnnouncements(1);
  }, [fetchAnnouncements]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    fetchAnnouncements(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Announcements
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Announcements
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Announcements
      </Typography>

      {announcements.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4, py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No announcements found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are currently no active announcements to display.
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Showing {announcements.length} of {totalCount} announcements
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {announcements.map((announcement) => (
              <Card key={announcement.id} elevation={2}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {announcement.title}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      By {announcement.creator?.name || 'Unknown'} • {formatDate(announcement.created_at)}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box 
                    sx={{ 
                      '& p': { mb: 1 },
                      '& h1, & h2, & h3, & h4, & h5, & h6': { mb: 1, mt: 2 },
                      '& ul, & ol': { mb: 1, pl: 2 },
                      '& blockquote': { 
                        borderLeft: '4px solid #ccc', 
                        pl: 2, 
                        ml: 0, 
                        fontStyle: 'italic',
                        color: 'text.secondary'
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: announcement.content 
                    }}
                  />

                  {announcement.updated_at !== announcement.created_at && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {formatDate(announcement.updated_at)}
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
    </Box>
  );
};

export default AnnouncementsPage;
