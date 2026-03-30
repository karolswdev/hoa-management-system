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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EventBusy as ExceptionIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import AdminDataTable, { type TableColumn, type TableAction } from '../../components/admin/AdminDataTable';
import { apiService } from '../../services/api';
import type {
  CalendarEntry,
  CalendarEntryCategory,
  CalendarFrequency,
  PaginatedResponse,
  CreateCalendarEntryRequest,
  UpdateCalendarEntryRequest,
} from '../../types/api';

const CATEGORIES: { value: CalendarEntryCategory; label: string; color: string }[] = [
  { value: 'trash', label: 'Trash', color: '#4CAF50' },
  { value: 'recycling', label: 'Recycling', color: '#2196F3' },
  { value: 'yard_waste', label: 'Yard Waste', color: '#8BC34A' },
  { value: 'meeting', label: 'Meeting', color: '#9C27B0' },
  { value: 'dues', label: 'Dues', color: '#F44336' },
  { value: 'community', label: 'Community', color: '#FF9800' },
  { value: 'holiday', label: 'Holiday', color: '#E91E63' },
  { value: 'other', label: 'Other', color: '#9E9E9E' },
];

const FREQUENCIES: { value: CalendarFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKS_OF_MONTH = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface FormData {
  title: string;
  description: string;
  category: CalendarEntryCategory;
  color: string;
  all_day: boolean;
  start_date: Date | null;
  end_date: Date | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  frequency: CalendarFrequency | '';
  day_of_week: number | '';
  week_of_month: number | '';
  month_of_year: number | '';
  day_of_month: number | '';
  recurrence_end: Date | null;
  seasonal_start: number | '';
  seasonal_end: number | '';
}

const defaultForm: FormData = {
  title: '',
  description: '',
  category: 'community',
  color: '#FF9800',
  all_day: true,
  start_date: null,
  end_date: null,
  start_time: '',
  end_time: '',
  is_recurring: false,
  frequency: '',
  day_of_week: '',
  week_of_month: '',
  month_of_year: '',
  day_of_month: '',
  recurrence_end: null,
  seasonal_start: '',
  seasonal_end: '',
};

const AdminCalendarPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exceptionsModalOpen, setExceptionsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  const [formData, setFormData] = useState<FormData>({ ...defaultForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewOccurrences, setPreviewOccurrences] = useState<string[]>([]);

  // Exception form state
  const [exceptionDate, setExceptionDate] = useState<Date | null>(null);
  const [exceptionMoveToDate, setExceptionMoveToDate] = useState<Date | null>(null);
  const [exceptionNote, setExceptionNote] = useState('');
  const [exceptionIsMove, setExceptionIsMove] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<CalendarEntry> = await apiService.getCalendarEntries({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortColumn,
        sortOrder: sortDirection,
      });
      setEntries(response.data);
      setTotalItems(response.pagination.totalItems);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to load calendar entries';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortDirection]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (formData.is_recurring && !formData.frequency) errors.frequency = 'Frequency is required for recurring entries';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildRequestData = (): CreateCalendarEntryRequest => {
    const data: CreateCalendarEntryRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      color: formData.color || undefined,
      all_day: formData.all_day,
      start_date: formData.start_date!.toISOString().split('T')[0],
      is_recurring: formData.is_recurring,
    };

    if (formData.end_date) data.end_date = formData.end_date.toISOString().split('T')[0];
    if (!formData.all_day && formData.start_time) data.start_time = formData.start_time;
    if (!formData.all_day && formData.end_time) data.end_time = formData.end_time;

    if (formData.is_recurring) {
      data.frequency = formData.frequency as CalendarFrequency;
      if (formData.day_of_week !== '') data.day_of_week = formData.day_of_week as number;
      if (formData.week_of_month !== '') data.week_of_month = formData.week_of_month as number;
      if (formData.month_of_year !== '') data.month_of_year = formData.month_of_year as number;
      if (formData.day_of_month !== '') data.day_of_month = formData.day_of_month as number;
      if (formData.recurrence_end) data.recurrence_end = formData.recurrence_end.toISOString().split('T')[0];
      if (formData.seasonal_start !== '') data.seasonal_start = formData.seasonal_start as number;
      if (formData.seasonal_end !== '') data.seasonal_end = formData.seasonal_end as number;
    }

    return data;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    try {
      await apiService.createCalendarEntry(buildRequestData());
      enqueueSnackbar('Calendar entry created', { variant: 'success' });
      setCreateModalOpen(false);
      resetForm();
      loadEntries();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to create entry';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleEdit = async () => {
    if (!selectedEntry || !validateForm()) return;
    try {
      await apiService.updateCalendarEntry(selectedEntry.id, buildRequestData() as UpdateCalendarEntryRequest);
      enqueueSnackbar('Calendar entry updated', { variant: 'success' });
      setEditModalOpen(false);
      setSelectedEntry(null);
      resetForm();
      loadEntries();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to update entry';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    try {
      await apiService.deleteCalendarEntry(selectedEntry.id);
      enqueueSnackbar('Calendar entry deleted', { variant: 'success' });
      setDeleteModalOpen(false);
      setSelectedEntry(null);
      loadEntries();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to delete entry';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleAddException = async () => {
    if (!selectedEntry || !exceptionDate) return;
    if (exceptionIsMove && !exceptionMoveToDate) return;
    try {
      await apiService.addCalendarException(selectedEntry.id, {
        exception_date: exceptionDate.toISOString().split('T')[0],
        is_cancelled: true,
        override_date: exceptionIsMove && exceptionMoveToDate
          ? exceptionMoveToDate.toISOString().split('T')[0]
          : undefined,
        note: exceptionNote.trim() || undefined,
      });
      enqueueSnackbar(exceptionIsMove ? 'Occurrence moved' : 'Exception added', { variant: 'success' });
      setExceptionDate(null);
      setExceptionMoveToDate(null);
      setExceptionNote('');
      setExceptionIsMove(false);
      // Refresh the entry to show updated exceptions
      const updated = await apiService.getCalendarEntry(selectedEntry.id);
      setSelectedEntry(updated);
      loadEntries();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to add exception';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleRemoveException = async (exceptionId: number) => {
    try {
      await apiService.removeCalendarException(exceptionId);
      enqueueSnackbar('Exception removed', { variant: 'success' });
      if (selectedEntry) {
        const updated = await apiService.getCalendarEntry(selectedEntry.id);
        setSelectedEntry(updated);
      }
      loadEntries();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to remove exception';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultForm });
    setFormErrors({});
    setPreviewOccurrences([]);
  };

  const openEditModal = (entry: CalendarEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      description: entry.description || '',
      category: entry.category,
      color: entry.color || '#9E9E9E',
      all_day: entry.all_day,
      start_date: new Date(entry.start_date + 'T00:00:00'),
      end_date: entry.end_date ? new Date(entry.end_date + 'T00:00:00') : null,
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      is_recurring: entry.is_recurring,
      frequency: entry.frequency || '',
      day_of_week: entry.day_of_week ?? '',
      week_of_month: entry.week_of_month ?? '',
      month_of_year: entry.month_of_year ?? '',
      day_of_month: entry.day_of_month ?? '',
      recurrence_end: entry.recurrence_end ? new Date(entry.recurrence_end + 'T00:00:00') : null,
      seasonal_start: entry.seasonal_start ?? '',
      seasonal_end: entry.seasonal_end ?? '',
    });
    setEditModalOpen(true);
    // Load preview
    loadPreview(entry.id);
  };

  const loadPreview = async (entryId: number) => {
    try {
      const result = await apiService.getCalendarEntryOccurrences(entryId, 5);
      setPreviewOccurrences(result.occurrences);
    } catch {
      setPreviewOccurrences([]);
    }
  };

  const openExceptionsModal = async (entry: CalendarEntry) => {
    try {
      const fullEntry = await apiService.getCalendarEntry(entry.id);
      setSelectedEntry(fullEntry);
      setExceptionsModalOpen(true);
    } catch {
      enqueueSnackbar('Failed to load entry details', { variant: 'error' });
    }
  };

  const frequencyLabel = (entry: CalendarEntry) => {
    if (!entry.is_recurring) return 'One-time';
    const freq = FREQUENCIES.find(f => f.value === entry.frequency);
    return freq?.label || entry.frequency || '';
  };

  const seasonLabel = (entry: CalendarEntry) => {
    if (!entry.seasonal_start && !entry.seasonal_end) return '-';
    const startMonth = entry.seasonal_start ? MONTHS[entry.seasonal_start - 1] : '';
    const endMonth = entry.seasonal_end ? MONTHS[entry.seasonal_end - 1] : '';
    if (startMonth && endMonth) return `${startMonth} - ${endMonth}`;
    if (startMonth) return `From ${startMonth}`;
    return `Until ${endMonth}`;
  };

  const columns: TableColumn<CalendarEntry>[] = [
    {
      id: 'title',
      label: 'Title',
      sortable: true,
      render: (value: string, entry: CalendarEntry) => (
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: entry.color || '#9E9E9E',
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" fontWeight="medium">{value}</Typography>
          </Box>
          {entry.description && (
            <Typography variant="caption" color="text.secondary">
              {entry.description.length > 60 ? `${entry.description.substring(0, 60)}...` : entry.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => {
        const cat = CATEGORIES.find(c => c.value === value);
        return (
          <Chip
            label={cat?.label || value}
            size="small"
            sx={{ backgroundColor: cat?.color || '#9E9E9E', color: '#fff' }}
          />
        );
      },
    },
    {
      id: 'frequency',
      label: 'Frequency',
      render: (_: unknown, entry: CalendarEntry) => (
        <Typography variant="body2">{frequencyLabel(entry)}</Typography>
      ),
    },
    {
      id: 'start_date',
      label: 'Start Date',
      sortable: true,
      render: (value: string) => (
        <Typography variant="body2">{value}</Typography>
      ),
    },
    {
      id: 'seasonal_start',
      label: 'Season',
      render: (_: unknown, entry: CalendarEntry) => (
        <Typography variant="body2">{seasonLabel(entry)}</Typography>
      ),
    },
  ];

  const actions: TableAction<CalendarEntry>[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <EditIcon />,
      color: 'primary',
      onClick: openEditModal,
    },
    {
      id: 'exceptions',
      label: 'Exceptions',
      icon: <ExceptionIcon />,
      color: 'warning',
      onClick: openExceptionsModal,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      color: 'error',
      onClick: (entry: CalendarEntry) => {
        setSelectedEntry(entry);
        setDeleteModalOpen(true);
      },
    },
  ];

  const showDayOfWeek = formData.is_recurring &&
    ['weekly', 'biweekly', 'monthly'].includes(formData.frequency as string);
  const showWeekOfMonth = formData.is_recurring && formData.frequency === 'monthly' && formData.day_of_week !== '';
  const showDayOfMonth = formData.is_recurring &&
    ['monthly', 'quarterly', 'yearly'].includes(formData.frequency as string) && formData.day_of_week === '';
  const showMonthOfYear = formData.is_recurring && formData.frequency === 'yearly';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Calendar Entries
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage recurring community calendar entries
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setCreateModalOpen(true); }}
          >
            Create Entry
          </Button>
        </Box>

        <AdminDataTable
          columns={columns}
          data={entries}
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
          emptyMessage="No calendar entries found"
        />

        {/* Create/Edit Modal */}
        <Dialog
          open={createModalOpen || editModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setEditModalOpen(false);
            setSelectedEntry(null);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {createModalOpen ? 'Create Calendar Entry' : 'Edit Calendar Entry'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                error={!!formErrors.title}
                helperText={formErrors.title}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <Box display="flex" gap={2}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={e => {
                      const cat = CATEGORIES.find(c => c.value === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value as CalendarEntryCategory,
                        color: cat?.color || formData.color,
                      });
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color }} />
                          {cat.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Color"
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  sx={{ width: 120 }}
                  slotProps={{ input: { sx: { height: 56 } } }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.all_day}
                    onChange={e => setFormData({ ...formData, all_day: e.target.checked })}
                  />
                }
                label="All-day"
              />

              <Box display="flex" gap={2}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={date => setFormData({ ...formData, start_date: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!formErrors.start_date,
                      helperText: formErrors.start_date,
                    },
                  }}
                />
                {!formData.is_recurring && (
                  <DatePicker
                    label="End Date"
                    value={formData.end_date}
                    onChange={date => setFormData({ ...formData, end_date: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                )}
              </Box>

              {!formData.all_day && (
                <Box display="flex" gap={2}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="End Time"
                    type="time"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_recurring}
                    onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                }
                label="Recurring"
              />

              {formData.is_recurring && (
                <Box display="flex" flexDirection="column" gap={2} sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                  <FormControl fullWidth required error={!!formErrors.frequency}>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={formData.frequency}
                      label="Frequency"
                      onChange={e => setFormData({ ...formData, frequency: e.target.value as CalendarFrequency })}
                    >
                      {FREQUENCIES.map(f => (
                        <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                      ))}
                    </Select>
                    {formErrors.frequency && (
                      <Typography variant="caption" color="error">{formErrors.frequency}</Typography>
                    )}
                  </FormControl>

                  {showDayOfWeek && (
                    <FormControl fullWidth>
                      <InputLabel>Day of Week</InputLabel>
                      <Select
                        value={formData.day_of_week}
                        label="Day of Week"
                        onChange={e => setFormData({ ...formData, day_of_week: e.target.value as number })}
                      >
                        {DAYS_OF_WEEK.map((day, i) => (
                          <MenuItem key={i} value={i}>{day}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {showWeekOfMonth && (
                    <FormControl fullWidth>
                      <InputLabel>Week of Month</InputLabel>
                      <Select
                        value={formData.week_of_month}
                        label="Week of Month"
                        onChange={e => setFormData({ ...formData, week_of_month: e.target.value as number })}
                      >
                        {WEEKS_OF_MONTH.map(w => (
                          <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {showDayOfMonth && (
                    <TextField
                      label="Day of Month"
                      type="number"
                      value={formData.day_of_month}
                      onChange={e => setFormData({ ...formData, day_of_month: parseInt(e.target.value) || '' })}
                      slotProps={{ htmlInput: { min: 1, max: 31 } }}
                      fullWidth
                    />
                  )}

                  {showMonthOfYear && (
                    <FormControl fullWidth>
                      <InputLabel>Month</InputLabel>
                      <Select
                        value={formData.month_of_year}
                        label="Month"
                        onChange={e => setFormData({ ...formData, month_of_year: e.target.value as number })}
                      >
                        {MONTHS.map((month, i) => (
                          <MenuItem key={i} value={i + 1}>{month}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Seasonal Bounds (optional)
                  </Typography>
                  <Box display="flex" gap={2}>
                    <FormControl fullWidth>
                      <InputLabel>Active From</InputLabel>
                      <Select
                        value={formData.seasonal_start}
                        label="Active From"
                        onChange={e => setFormData({ ...formData, seasonal_start: e.target.value as number })}
                      >
                        <MenuItem value="">None</MenuItem>
                        {MONTHS.map((month, i) => (
                          <MenuItem key={i} value={i + 1}>{month}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Active Until</InputLabel>
                      <Select
                        value={formData.seasonal_end}
                        label="Active Until"
                        onChange={e => setFormData({ ...formData, seasonal_end: e.target.value as number })}
                      >
                        <MenuItem value="">None</MenuItem>
                        {MONTHS.map((month, i) => (
                          <MenuItem key={i} value={i + 1}>{month}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <DatePicker
                    label="Recurrence End Date (optional)"
                    value={formData.recurrence_end}
                    onChange={date => setFormData({ ...formData, recurrence_end: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              )}

              {/* Preview panel for edit mode */}
              {editModalOpen && previewOccurrences.length > 0 && (
                <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Next Occurrences
                  </Typography>
                  {previewOccurrences.map((date, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateModalOpen(false);
              setEditModalOpen(false);
              setSelectedEntry(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={createModalOpen ? handleCreate : handleEdit}
              variant="contained"
              color="primary"
            >
              {createModalOpen ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Calendar Entry</DialogTitle>
          <DialogContent>
            {selectedEntry && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action cannot be undone. The entry and all its exceptions will be permanently deleted.
                </Alert>
                <Typography variant="body1">
                  Are you sure you want to delete <strong>"{selectedEntry.title}"</strong>?
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Exceptions Modal */}
        <Dialog
          open={exceptionsModalOpen}
          onClose={() => { setExceptionsModalOpen(false); setSelectedEntry(null); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Manage Exceptions — {selectedEntry?.title}
          </DialogTitle>
          <DialogContent>
            {selectedEntry && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                  Current Exceptions
                </Typography>
                {selectedEntry.exceptions && selectedEntry.exceptions.length > 0 ? (
                  <List dense>
                    {selectedEntry.exceptions.map(ex => (
                      <ListItem key={ex.id}>
                        <ListItemText
                          primary={new Date(ex.exception_date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                          })}
                          secondary={
                            <>
                              {ex.is_cancelled && ex.override_date
                                ? `Moved to ${new Date(ex.override_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                                : ex.is_cancelled
                                  ? 'Cancelled'
                                  : `Override: ${ex.override_title}`}
                              {ex.note && ` — ${ex.note}`}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" size="small" onClick={() => handleRemoveException(ex.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No exceptions
                  </Typography>
                )}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Add Exception
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <DatePicker
                    label="Original Date"
                    value={exceptionDate}
                    onChange={date => setExceptionDate(date)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exceptionIsMove}
                        onChange={e => {
                          setExceptionIsMove(e.target.checked);
                          if (!e.target.checked) setExceptionMoveToDate(null);
                        }}
                      />
                    }
                    label="Move to a different date (instead of cancelling)"
                  />
                  {exceptionIsMove && (
                    <DatePicker
                      label="Move To Date"
                      value={exceptionMoveToDate}
                      onChange={date => setExceptionMoveToDate(date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                  <TextField
                    label="Note (optional)"
                    value={exceptionNote}
                    onChange={e => setExceptionNote(e.target.value)}
                    placeholder={exceptionIsMove
                      ? 'e.g., Moved due to Christmas holiday'
                      : 'e.g., No pickup — Christmas Day'}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddException}
                    disabled={!exceptionDate || (exceptionIsMove && !exceptionMoveToDate)}
                  >
                    {exceptionIsMove ? 'Move Occurrence' : 'Skip Date'}
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setExceptionsModalOpen(false); setSelectedEntry(null); }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdminCalendarPage;
