import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Popover,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Place as PlaceIcon,
  AccessTime as TimeIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { apiService } from '../../services/api';
import type { CalendarItem } from '../../types/api';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  trash: { label: 'Trash', color: '#4CAF50' },
  recycling: { label: 'Recycling', color: '#2196F3' },
  yard_waste: { label: 'Yard Waste', color: '#8BC34A' },
  meeting: { label: 'Meeting', color: '#9C27B0' },
  dues: { label: 'Dues', color: '#F44336' },
  community: { label: 'Community', color: '#FF9800' },
  holiday: { label: 'Holiday', color: '#E91E63' },
  event: { label: 'Events', color: '#2196F3' },
  poll: { label: 'Polls', color: '#FF9800' },
  announcement: { label: 'Announcements', color: '#607D8B' },
  other: { label: 'Other', color: '#9E9E9E' },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

const CalendarPage: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES));
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const currentRange = useRef<{ start: string; end: string } | null>(null);

  const fetchItems = useCallback(async (start: string, end: string, categories: Set<string>) => {
    try {
      setLoading(true);
      setError(null);
      const catArray = categories.size === ALL_CATEGORIES.length ? undefined : Array.from(categories);
      const response = await apiService.getCalendarItems(start, end, catArray);
      setItems(response.items);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to load calendar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const start = arg.startStr.split('T')[0];
    const end = arg.endStr.split('T')[0];
    currentRange.current = { start, end };
    fetchItems(start, end, activeCategories);
  }, [fetchItems, activeCategories]);

  const toggleCategory = (category: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      if (currentRange.current) {
        fetchItems(currentRange.current.start, currentRange.current.end, next);
      }
      return next;
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const item = items.find(i => i.id === arg.event.id);
    if (item) {
      setSelectedItem(item);
      setPopoverAnchor(arg.el);
    }
  };

  const handlePopoverClose = () => {
    setSelectedItem(null);
    setPopoverAnchor(null);
  };

  // Convert CalendarItems to FullCalendar events
  const calendarEvents = items
    .filter(item => activeCategories.has(item.category))
    .map(item => ({
      id: item.id,
      title: item.title,
      start: item.start,
      end: item.end,
      allDay: item.allDay,
      backgroundColor: item.color || CATEGORY_CONFIG[item.category]?.color || '#9E9E9E',
      borderColor: item.color || CATEGORY_CONFIG[item.category]?.color || '#9E9E9E',
    }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Community Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            All community events, deadlines, and schedules in one place
          </Typography>
        </Box>
      </Box>

      {/* Category Filter Chips */}
      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
        {ALL_CATEGORIES.map(cat => {
          const config = CATEGORY_CONFIG[cat];
          const isActive = activeCategories.has(cat);
          return (
            <Chip
              key={cat}
              label={config.label}
              onClick={() => toggleCategory(cat)}
              variant={isActive ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: isActive ? config.color : 'transparent',
                color: isActive ? '#fff' : config.color,
                borderColor: config.color,
                '&:hover': {
                  backgroundColor: isActive ? config.color : `${config.color}20`,
                },
              }}
              size="small"
            />
          );
        })}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Calendar */}
      <Paper sx={{ p: 2, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth',
          }}
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={4}
          nowIndicator
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            list: 'Agenda',
          }}
        />
      </Paper>

      {/* Item Detail Popover */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {selectedItem && (
          <Paper sx={{ p: 2, maxWidth: 360, minWidth: 260 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: selectedItem.color || CATEGORY_CONFIG[selectedItem.category]?.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedItem.title}
              </Typography>
            </Box>

            <Chip
              label={CATEGORY_CONFIG[selectedItem.category]?.label || selectedItem.category}
              size="small"
              sx={{ mb: 1 }}
            />

            <Divider sx={{ my: 1 }} />

            {selectedItem.start && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {selectedItem.allDay
                    ? selectedItem.start
                    : new Date(selectedItem.start).toLocaleString()}
                  {selectedItem.end && !selectedItem.allDay && (
                    <> — {new Date(selectedItem.end).toLocaleString()}</>
                  )}
                </Typography>
              </Box>
            )}

            {selectedItem.location && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <PlaceIcon fontSize="small" color="action" />
                <Typography variant="body2">{selectedItem.location}</Typography>
              </Box>
            )}

            {selectedItem.isRecurring && (
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <RepeatIcon fontSize="small" color="action" />
                <Typography variant="body2">Recurring</Typography>
              </Box>
            )}

            {selectedItem.description && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {selectedItem.description.length > 200
                    ? `${selectedItem.description.substring(0, 200)}...`
                    : selectedItem.description}
                </Typography>
              </>
            )}

            {selectedItem.note && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="warning.main" fontStyle="italic">
                  {selectedItem.note}
                </Typography>
              </>
            )}
          </Paper>
        )}
      </Popover>
    </Box>
  );
};

export default CalendarPage;
