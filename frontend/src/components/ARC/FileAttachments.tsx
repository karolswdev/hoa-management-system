import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Download, Upload, AttachFile } from '@mui/icons-material';
import { format } from 'date-fns';
import type { WorkflowAttachment } from '../../types/api';
import { apiService } from '../../services/api';
import { useUploadWorkflowAttachments } from '../../hooks/useWorkflows';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileAttachmentsProps {
  attachments: WorkflowAttachment[];
  workflowId: number;
  canUpload: boolean;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({ attachments, workflowId, canUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending } = useUploadWorkflowAttachments();

  const handleDownload = async (attachment: WorkflowAttachment) => {
    const blob = await apiService.downloadWorkflowAttachment(workflowId, attachment.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.original_file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    upload({ workflowId, files: Array.from(files) });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Box>
      {attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No attachments.
        </Typography>
      )}
      <List dense disablePadding>
        {attachments.map((att) => (
          <ListItem key={att.id} disableGutters>
            <AttachFile fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
            <ListItemText
              primary={att.original_file_name}
              secondary={`${formatFileSize(att.file_size)} - ${format(new Date(att.created_at), 'MMM d, yyyy')}`}
            />
            <ListItemSecondaryAction>
              <IconButton size="small" onClick={() => handleDownload(att)}>
                <Download fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {canUpload && (
        <Box sx={{ mt: 1 }}>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload} />
          <Button
            variant="outlined"
            size="small"
            startIcon={isPending ? <CircularProgress size={16} /> : <Upload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            Upload Files
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FileAttachments;
