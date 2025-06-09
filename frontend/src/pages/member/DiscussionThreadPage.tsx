import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Reply as ReplyIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import type { Discussion, DiscussionThreadResponse } from '../../types/api';

const DiscussionThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  useApiNotifications(); // Set up API error handling
  
  const [threadData, setThreadData] = useState<DiscussionThreadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const fetchThread = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await apiService.getDiscussionThread(parseInt(id));
      
      // Ensure we have valid data structure
      if (response && response.mainThread && response.replies) {
        setThreadData(response);
      } else {
        // Handle unexpected response structure
        setThreadData(null);
        showError('Invalid discussion thread data received.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Failed to load discussion thread. Please try again.';
      showError(errorMessage);
      
      // If thread not found, redirect back to discussions
      if (err.response?.status === 404) {
        setTimeout(() => navigate('/discussions'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  const handleBackClick = () => {
    navigate('/discussions');
  };

  const validateReply = () => {
    if (!replyContent.trim()) {
      setReplyError('Reply content is required');
      return false;
    }
    if (replyContent.length > 5000) {
      setReplyError('Reply must be less than 5000 characters');
      return false;
    }
    setReplyError('');
    return true;
  };

  const handleSubmitReply = async () => {
    if (!validateReply() || !id) return;
    
    try {
      setSubmittingReply(true);
      await apiService.createReply(parseInt(id), {
        content: replyContent.trim(),
      });
      
      showSuccess('Reply posted successfully!');
      setReplyContent('');
      fetchThread(); // Refresh to show new reply
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to post reply. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!threadData) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Back to Discussions
        </Button>
        <Alert severity="error">
          Discussion thread not found or could not be loaded.
        </Alert>
      </Box>
    );
  }

  const { mainThread, replies } = threadData;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          variant="outlined"
        >
          Back to Discussions
        </Button>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            icon={<ReplyIcon />}
            label={`${replies?.length || 0} ${(replies?.length || 0) === 1 ? 'reply' : 'replies'}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Main Thread */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {mainThread.title}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              {getInitials(mainThread.author?.name || 'Unknown User')}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {mainThread.author?.name || 'Unknown User'}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(mainThread.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography
            variant="body1"
            sx={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: mainThread.content }}
          />
        </CardContent>
      </Card>

      {/* Replies Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
        Replies ({replies?.length || 0})
      </Typography>

      {!replies || replies.length === 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box textAlign="center" py={3}>
              <ReplyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No replies yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to reply to this discussion!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2} mb={3}>
          {replies && replies.map((reply, index) => (
            <Card key={reply.id}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    {getInitials(reply.author?.name || 'Unknown User')}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {reply.author?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(reply.created_at)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: reply.content }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Reply Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Post a Reply
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Your Reply"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              error={!!replyError}
              helperText={replyError || `${replyContent.length}/5000 characters`}
              multiline
              rows={4}
              fullWidth
              inputProps={{ maxLength: 5000 }}
              placeholder="Share your thoughts..."
            />
            
            <Alert severity="info" sx={{ mb: 2 }}>
              You can use basic HTML formatting in your reply (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;br&gt; for line breaks).
            </Alert>
            
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={submittingReply ? <CircularProgress size={16} /> : <SendIcon />}
                onClick={handleSubmitReply}
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DiscussionThreadPage;
