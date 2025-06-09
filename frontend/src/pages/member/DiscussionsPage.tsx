import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Forum as ForumIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import type { Discussion, PaginatedResponse } from '../../types/api';

const DiscussionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  useApiNotifications(); // Set up API error handling
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  
  // New Discussion Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const fetchDiscussions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Discussion> = await apiService.getDiscussions({
        page,
        limit: 10,
      });
      
      setDiscussions(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Failed to load discussions. Please try again.';
      showError(errorMessage);
      // Ensure discussions is always an array even on error
      setDiscussions([]);
      setPagination({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    fetchDiscussions(page);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setNewDiscussion({ title: '', content: '' });
    setErrors({});
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewDiscussion({ title: '', content: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};
    
    if (!newDiscussion.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (newDiscussion.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (!newDiscussion.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (newDiscussion.content.length > 5000) {
      newErrors.content = 'Content must be less than 5000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitDiscussion = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      await apiService.createDiscussion({
        title: newDiscussion.title.trim(),
        content: newDiscussion.content.trim(),
      });
      
      showSuccess('Discussion thread created successfully!');
      handleCloseDialog();
      fetchDiscussions(1); // Refresh to show new discussion
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to create discussion. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscussionClick = (discussionId: number) => {
    navigate(`/discussions/${discussionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ForumIcon color="primary" />
          <Typography variant="h4" component="h1">
            Community Discussions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Start New Discussion
        </Button>
      </Box>

      {/* Discussions List */}
      {!discussions || discussions.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <ForumIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No discussions yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Be the first to start a community discussion!
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Start New Discussion
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {discussions && discussions.map((discussion) => (
            <Card
              key={discussion.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleDiscussionClick(discussion.id)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    {discussion.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {discussion.reply_count !== undefined && discussion.reply_count > 0 && (
                      <Chip
                        icon={<ReplyIcon />}
                        label={`${discussion.reply_count} ${discussion.reply_count === 1 ? 'reply' : 'replies'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
                
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  dangerouslySetInnerHTML={{ __html: discussion.content }}
                />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {discussion.author?.name || 'Unknown User'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(discussion.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* New Discussion Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Start New Discussion</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Discussion Title"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
              error={!!errors.title}
              helperText={errors.title || `${newDiscussion.title.length}/200 characters`}
              fullWidth
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label="Content"
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
              error={!!errors.content}
              helperText={errors.content || `${newDiscussion.content.length}/5000 characters`}
              multiline
              rows={6}
              fullWidth
              inputProps={{ maxLength: 5000 }}
            />
            <Alert severity="info">
              You can use basic HTML formatting in your content (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;br&gt; for line breaks).
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitDiscussion}
            variant="contained"
            disabled={submitting || !newDiscussion.title.trim() || !newDiscussion.content.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : 'Create Discussion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiscussionsPage;
