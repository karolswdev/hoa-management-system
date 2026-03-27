import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { format } from 'date-fns';
import type { WorkflowComment } from '../../types/api';
import { useAddWorkflowComment } from '../../hooks/useWorkflows';

interface CommentThreadProps {
  comments: WorkflowComment[];
  isCommitteeMember: boolean;
  workflowId: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comments, isCommitteeMember, workflowId }) => {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const { mutate: addComment, isPending } = useAddWorkflowComment();

  const visibleComments = comments.filter((c) => isCommitteeMember || !c.is_internal);
  const sorted = [...visibleComments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const handleSubmit = () => {
    if (!content.trim()) return;
    addComment(
      { workflowId, data: { content: content.trim(), is_internal: isInternal } },
      {
        onSuccess: () => {
          setContent('');
          setIsInternal(false);
        },
      }
    );
  };

  return (
    <Box>
      {sorted.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No comments yet.
        </Typography>
      )}
      {sorted.map((comment) => (
        <Paper
          key={comment.id}
          variant="outlined"
          sx={{
            p: 2,
            mb: 1.5,
            bgcolor: comment.is_internal ? 'action.hover' : 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2">
              {comment.author?.name ?? `User #${comment.created_by}`}
              {comment.is_internal && (
                <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                  Internal
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Box>
          <Typography variant="body2">{comment.content}</Typography>
        </Paper>
      ))}

      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a comment..."
          multiline
          minRows={2}
          maxRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!content.trim() || isPending}
          sx={{ minWidth: 'auto', px: 2 }}
        >
          {isPending ? <CircularProgress size={20} /> : <Send />}
        </Button>
      </Box>
      {isCommitteeMember && (
        <FormControlLabel
          control={<Checkbox checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} size="small" />}
          label={<Typography variant="caption">Internal comment (only visible to committee)</Typography>}
          sx={{ mt: 0.5 }}
        />
      )}
    </Box>
  );
};

export default CommentThread;
