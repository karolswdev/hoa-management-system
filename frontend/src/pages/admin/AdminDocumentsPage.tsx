import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn, type TableAction } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type { Document, DocumentsResponse } from '../../types/api';

const AdminDocumentsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // State for modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // State for upload form
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    isPublic: true,
    file: null as File | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load documents data
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (currentPage - 1) * itemsPerPage;
      const response: DocumentsResponse = await apiService.getDocuments({
        limit: itemsPerPage,
        offset,
      });
      
      setDocuments(response.documents);
      setTotalItems(response.count);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load documents');
      enqueueSnackbar('Failed to load documents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentPage]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!uploadData.title.trim()) {
      errors.title = 'Title is required';
    } else if (uploadData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    if (uploadData.description && uploadData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }
    
    if (!uploadData.file) {
      errors.file = 'Please select a file to upload';
    } else {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (uploadData.file.size > maxSize) {
        errors.file = 'File size must be less than 10MB';
      }
      
      // Check file type (basic validation)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
      ];
      
      if (!allowedTypes.includes(uploadData.file.type)) {
        errors.file = 'File type not supported. Please upload PDF, Word, Excel, text, or image files.';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file upload
  const handleUploadDocument = async () => {
    if (!validateForm()) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('documentFile', uploadData.file!);
      formData.append('title', uploadData.title.trim());
      if (uploadData.description) {
        formData.append('description', uploadData.description.trim());
      }
      formData.append('is_public', uploadData.isPublic.toString());
      
      // Simulate upload progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      await apiService.uploadDocument(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      enqueueSnackbar('Document uploaded successfully', { variant: 'success' });
      setUploadModalOpen(false);
      resetUploadForm();
      loadDocuments();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to upload document', { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle document approval
  const handleApproveDocument = async (document: Document) => {
    try {
      await apiService.approveDocument(document.id);
      enqueueSnackbar('Document approved successfully', { variant: 'success' });
      loadDocuments();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to approve document', { variant: 'error' });
    }
  };

  // Handle document download
  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await apiService.downloadDocument(document.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('Document downloaded successfully', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to download document', { variant: 'error' });
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      await apiService.deleteDocument(selectedDocument.id);
      
      enqueueSnackbar('Document deleted successfully', { variant: 'success' });
      setDeleteModalOpen(false);
      setSelectedDocument(null);
      loadDocuments();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete document', { variant: 'error' });
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadData({
      title: '',
      description: '',
      isPublic: true,
      file: null,
    });
    setFormErrors({});
    setUploadProgress(0);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadData({ ...uploadData, file });
    
    // Auto-fill title from filename if empty
    if (file && !uploadData.title) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setUploadData(prev => ({ ...prev, title: nameWithoutExtension, file }));
    }
  };

  // Define table columns
  const columns: TableColumn<Document>[] = [
    {
      id: 'title',
      label: 'Document',
      sortable: true,
      render: (value: string, document: Document) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {document.original_file_name}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (value: string | null) => (
        <Typography variant="body2" sx={{ maxWidth: 300 }}>
          {value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : '-'}
        </Typography>
      ),
    },
    {
      id: 'uploader',
      label: 'Uploaded By',
      align: 'center',
      render: (_, document: Document) => (
        <Typography variant="body2">
          {document.uploader?.name || 'Unknown'}
        </Typography>
      ),
    },
    {
      id: 'approved',
      label: 'Status',
      align: 'center',
      render: (value: boolean) => (
        <Chip
          label={value ? 'Approved' : 'Pending'}
          color={value ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      id: 'is_public',
      label: 'Visibility',
      align: 'center',
      render: (value: boolean) => (
        <Chip
          label={value ? 'Public' : 'Private'}
          color={value ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'uploaded_at',
      label: 'Uploaded',
      align: 'center',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define table actions
  const actions: TableAction<Document>[] = [
    {
      id: 'download',
      label: 'Download',
      icon: <DownloadIcon />,
      color: 'primary',
      onClick: handleDownloadDocument,
    },
    {
      id: 'approve',
      label: 'Approve',
      icon: <ApproveIcon />,
      color: 'success',
      onClick: handleApproveDocument,
      show: (document: Document) => !document.approved,
    },
    {
      id: 'delete',
      label: 'Delete Document',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: (document: Document) => {
        setSelectedDocument(document);
        setDeleteModalOpen(true);
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Document Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload and manage community documents
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => {
            resetUploadForm();
            setUploadModalOpen(true);
          }}
        >
          Upload Document
        </Button>
      </Box>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={documents}
        loading={loading}
        error={error}
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        actions={actions}
        emptyMessage="No documents found"
      />

      {/* Upload Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => {
          if (!uploading) {
            setUploadModalOpen(false);
            resetUploadForm();
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              error={!!formErrors.title}
              helperText={formErrors.title || `${uploadData.title.length}/200 characters`}
              fullWidth
              required
              disabled={uploading}
            />
            
            <TextField
              label="Description (Optional)"
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              error={!!formErrors.description}
              helperText={formErrors.description || `${uploadData.description.length}/1000 characters`}
              multiline
              rows={3}
              fullWidth
              disabled={uploading}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={uploadData.isPublic}
                  onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.checked })}
                  disabled={uploading}
                />
              }
              label="Make document publicly visible"
            />
            
            <Box>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={uploading}
                  sx={{ mb: 1 }}
                >
                  {uploadData.file ? uploadData.file.name : 'Select File'}
                </Button>
              </label>
              {formErrors.file && (
                <Typography variant="caption" color="error">
                  {formErrors.file}
                </Typography>
              )}
            </Box>
            
            {uploading && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadModalOpen(false);
              resetUploadForm();
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            color="primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone. The document will be permanently deleted.
              </Alert>
              
              <Typography variant="body1">
                Are you sure you want to delete the document <strong>"{selectedDocument.title}"</strong>?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDocument} variant="contained" color="error">
            Delete Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDocumentsPage;
