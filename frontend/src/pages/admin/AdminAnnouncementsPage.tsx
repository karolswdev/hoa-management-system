import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn, type TableAction } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type { Announcement, CreateAnnouncementRequest, PaginatedResponse } from '../../types/api';

const AdminAnnouncementsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  
  // State for pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // State for form
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiresAt: null as Date | null,
    notify: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load announcements data
  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<Announcement> = await apiService.getAnnouncements({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortColumn,
        sortOrder: sortDirection,
      });
      
      setAnnouncements(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to load announcements';
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortDirection, enqueueSnackbar]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Handle sorting
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.length > 5000) {
      errors.content = 'Content must be less than 5000 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    if (!validateForm()) return;
    
    try {
      const data: CreateAnnouncementRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        expiresAt: formData.expiresAt?.toISOString(),
        notify: formData.notify,
      };
      
      await apiService.createAnnouncement(data);
      
      enqueueSnackbar('Announcement created successfully', { variant: 'success' });
      setCreateModalOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to create announcement';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  // Handle edit announcement
  const handleEditAnnouncement = async () => {
    if (!selectedAnnouncement || !validateForm()) return;
    
    try {
      const data: Partial<CreateAnnouncementRequest> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        expiresAt: formData.expiresAt?.toISOString(),
      };
      
      await apiService.updateAnnouncement(selectedAnnouncement.id, data);
      
      enqueueSnackbar('Announcement updated successfully', { variant: 'success' });
      setEditModalOpen(false);
      setSelectedAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to update announcement';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;
    
    try {
      await apiService.deleteAnnouncement(selectedAnnouncement.id);
      
      enqueueSnackbar('Announcement deleted successfully', { variant: 'success' });
      setDeleteModalOpen(false);
      setSelectedAnnouncement(null);
      loadAnnouncements();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to delete announcement';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      expiresAt: null,
    });
    setFormErrors({});
  };

  // Open edit modal with data
  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      expiresAt: announcement.expires_at ? new Date(announcement.expires_at) : null,
    });
    setEditModalOpen(true);
  };

  // Define table columns
  const columns: TableColumn<Announcement>[] = [
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, announcement: Announcement) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {announcement.creator?.name || 'Unknown'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'content',
      label: 'Content',
      render: (value: string) => (
        <Typography variant="body2" sx={{ maxWidth: 300 }}>
          {value.length > 100 ? `${value.substring(0, 100)}...` : value}
        </Typography>
      ),
    },
    {
      id: 'expires_at',
      label: 'Expires',
      align: 'center',
      sortable: true,
      render: (value: string | null) => {
        if (!value) {
          return <Chip label="Never" color="default" size="small" />;
        }
        
        const expiryDate = new Date(value);
        const isExpired = expiryDate < new Date();
        
        return (
          <Tooltip title={expiryDate.toLocaleString()}>
            <Chip
              label={isExpired ? 'Expired' : 'Active'}
              color={isExpired ? 'error' : 'success'}
              size="small"
            />
          </Tooltip>
        );
      },
    },
    {
      id: 'created_at',
      label: 'Created',
      align: 'center',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Define table actions
  const actions: TableAction<Announcement>[] = [
    {
      id: 'edit',
      label: 'Edit Announcement',
      icon: <EditIcon />,
      color: 'primary',
      onClick: openEditModal,
    },
    {
      id: 'delete',
      label: 'Delete Announcement',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setDeleteModalOpen(true);
      },
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Announcement Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage community announcements
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
          >
            Create Announcement
          </Button>
        </Box>

        {/* Data Table */}
        <AdminDataTable
          columns={columns}
          data={announcements}
          loading={loading}
          error={error}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          actions={actions}
          emptyMessage="No announcements found"
        />

        {/* Create/Edit Modal */}
        <Dialog
          open={createModalOpen || editModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
            setSelectedAnnouncement(null);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {createModalOpen ? 'Create Announcement' : 'Edit Announcement'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!formErrors.title}
                helperText={formErrors.title || `${formData.title.length}/200 characters`}
                fullWidth
                required
              />
              
              <TextField
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                error={!!formErrors.content}
                helperText={formErrors.content || `${formData.content.length}/5000 characters`}
                multiline
                rows={6}
                fullWidth
                required
              />
              
              <DateTimePicker
                label="Expires At (Optional)"
                value={formData.expiresAt}
                onChange={(date) => setFormData({
                  ...formData,
                  expiresAt: date ? (date instanceof Date ? date : date.toDate()) : null
                })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Leave empty for permanent announcement',
                  },
                }}
              />
              <Box>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.notify}
                    onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                  />
                  <Typography variant="body2">Email this announcement to all approved members</Typography>
                </label>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                setSelectedAnnouncement(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createModalOpen ? handleCreateAnnouncement : handleEditAnnouncement}
              variant="contained"
              color="primary"
            >
              {createModalOpen ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Announcement</DialogTitle>
          <DialogContent>
            {selectedAnnouncement && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action cannot be undone. The announcement will be permanently deleted.
                </Alert>
                
                <Typography variant="body1">
                  Are you sure you want to delete the announcement <strong>"{selectedAnnouncement.title}"</strong>?
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteAnnouncement} variant="contained" color="error">
              Delete Announcement
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdminAnnouncementsPage;
