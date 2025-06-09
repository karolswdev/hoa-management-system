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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn, type TableAction } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type { Event, CreateEventRequest, UpdateEventRequest, PaginatedResponse } from '../../types/api';

const AdminEventsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  
  // State for data
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  
  // State for pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('event_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // State for modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // State for form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    location: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load events data
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<Event> = await apiService.getEvents({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortColumn,
        sortOrder: sortDirection,
      });
      
      setEvents(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
      enqueueSnackbar('Failed to load events', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentPage, sortColumn, sortDirection]);

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
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.length > 200) {
      errors.location = 'Location must be less than 200 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create event
  const handleCreateEvent = async () => {
    if (!validateForm()) return;
    
    try {
      const data: CreateEventRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: formData.startDate!.toISOString(),
        location: formData.location.trim(),
      };
      
      await apiService.createEvent(data);
      
      enqueueSnackbar('Event created successfully', { variant: 'success' });
      setCreateModalOpen(false);
      resetForm();
      loadEvents();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to create event', { variant: 'error' });
    }
  };

  // Handle edit event
  const handleEditEvent = async () => {
    if (!selectedEvent || !validateForm()) return;
    
    try {
      const data: UpdateEventRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.startDate!.toISOString(),
        end_date: formData.endDate!.toISOString(),
        location: formData.location.trim(),
      };
      
      await apiService.updateEvent(selectedEvent.id, data);
      
      enqueueSnackbar('Event updated successfully', { variant: 'success' });
      setEditModalOpen(false);
      setSelectedEvent(null);
      resetForm();
      loadEvents();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update event', { variant: 'error' });
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await apiService.deleteEvent(selectedEvent.id);
      
      enqueueSnackbar('Event deleted successfully', { variant: 'success' });
      setDeleteModalOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete event', { variant: 'error' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: null,
      endDate: null,
      location: '',
    });
    setFormErrors({});
  };

  // Open edit modal with data
  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      location: event.location,
    });
    setEditModalOpen(true);
  };

  // Define table columns
  const columns: TableColumn<Event>[] = [
    {
      id: 'title',
      label: 'Event',
      sortable: true,
      render: (value: string, event: Event) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {event.location}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (value: string) => (
        <Typography variant="body2" sx={{ maxWidth: 300 }}>
          {value.length > 100 ? `${value.substring(0, 100)}...` : value}
        </Typography>
      ),
    },
    {
      id: 'start_date',
      label: 'Start Date',
      align: 'center',
      sortable: true,
      render: (value: string) => {
        const date = new Date(value);
        return (
          <Box>
            <Typography variant="body2">
              {date.toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'end_date',
      label: 'End Date',
      align: 'center',
      sortable: true,
      render: (value: string) => {
        const date = new Date(value);
        return (
          <Box>
            <Typography variant="body2">
              {date.toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (_, event: Event) => {
        const now = new Date();
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        let status = 'upcoming';
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'primary';
        
        if (now > endDate) {
          status = 'completed';
          color = 'default';
        } else if (now >= startDate && now <= endDate) {
          status = 'ongoing';
          color = 'success';
        }
        
        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={color}
            size="small"
          />
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
  const actions: TableAction<Event>[] = [
    {
      id: 'edit',
      label: 'Edit Event',
      icon: <EditIcon />,
      color: 'primary',
      onClick: openEditModal,
    },
    {
      id: 'delete',
      label: 'Delete Event',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: (event: Event) => {
        setSelectedEvent(event);
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
              Event Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage community events
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
            Create Event
          </Button>
        </Box>

        {/* Data Table */}
        <AdminDataTable
          columns={columns}
          data={events}
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
          emptyMessage="No events found"
        />

        {/* Create/Edit Modal */}
        <Dialog
          open={createModalOpen || editModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
            setSelectedEvent(null);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {createModalOpen ? 'Create Event' : 'Edit Event'}
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
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!formErrors.description}
                helperText={formErrors.description || `${formData.description.length}/2000 characters`}
                multiline
                rows={4}
                fullWidth
                required
              />
              
              <TextField
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={!!formErrors.location}
                helperText={formErrors.location || `${formData.location.length}/200 characters`}
                fullWidth
                required
              />
              
              <Box display="flex" gap={2}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={formData.startDate}
                  onChange={(date) => setFormData({
                    ...formData,
                    startDate: date ? (date instanceof Date ? date : date.toDate()) : null
                  })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.startDate,
                      helperText: formErrors.startDate,
                      required: true,
                    },
                  }}
                />
                
                <DateTimePicker
                  label="End Date & Time"
                  value={formData.endDate}
                  onChange={(date) => setFormData({
                    ...formData,
                    endDate: date ? (date instanceof Date ? date : date.toDate()) : null
                  })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.endDate,
                      helperText: formErrors.endDate,
                      required: true,
                    },
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                setSelectedEvent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createModalOpen ? handleCreateEvent : handleEditEvent}
              variant="contained"
              color="primary"
            >
              {createModalOpen ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action cannot be undone. The event will be permanently deleted.
                </Alert>
                
                <Typography variant="body1">
                  Are you sure you want to delete the event <strong>"{selectedEvent.title}"</strong>?
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteEvent} variant="contained" color="error">
              Delete Event
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      </LocalizationProvider>
  );
};

export default AdminEventsPage;
