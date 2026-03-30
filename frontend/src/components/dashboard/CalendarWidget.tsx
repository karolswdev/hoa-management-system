import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { CalendarItem } from '../../types/api';

const CATEGORY_COLORS: Record<string, string> = {
  trash: '#4CAF50',
  recycling: '#2196F3',
  yard_waste: '#8BC34A',
  meeting: '#9C27B0',
  dues: '#F44336',
  community: '#FF9800',
  holiday: '#E91E63',
  event: '#2196F3',
  poll: '#FF9800',
  announcement: '#607D8B',
  other: '#9E9E9E',
};

function getDateRange(): { start: string; end: string; days: Date[] } {
  const today = new Date();
  // Start from Monday of the current week
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const start = formatDate(days[0]);
  const end = formatDate(days[13]);
  return { start, end, days };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getItemDate(item: CalendarItem): string {
  return item.start.split('T')[0];
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarWidget: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range] = useState(() => getDateRange());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await apiService.getCalendarItems(range.start, range.end);
        setItems(response.items);
      } catch {
        // Silent fail — widget is non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [range.start, range.end]);

  // Group items by date
  const itemsByDate: Record<string, CalendarItem[]> = {};
  for (const item of items) {
    const date = getItemDate(item);
    if (!itemsByDate[date]) itemsByDate[date] = [];
    itemsByDate[date].push(item);
  }

  const today = formatDate(new Date());

  const weekLabel = (weekIndex: number) => {
    if (weekIndex === 0) return 'This Week';
    return 'Next Week';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={() => navigate('/calendar')} sx={{ flex: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Community Calendar
              </Typography>
            </Box>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
              View Full Calendar →
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0, 1].map(weekIndex => (
                <Box key={weekIndex}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>
                    {weekLabel(weekIndex)}
                  </Typography>
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 0.5,
                  }}>
                    {/* Day headers (only on first week) */}
                    {weekIndex === 0 && DAY_NAMES.map(name => (
                      <Typography
                        key={name}
                        variant="caption"
                        color="text.secondary"
                        sx={{ textAlign: 'center', fontSize: '0.65rem' }}
                      >
                        {name}
                      </Typography>
                    ))}

                    {/* Day cells */}
                    {range.days.slice(weekIndex * 7, (weekIndex + 1) * 7).map(day => {
                      const dateStr = formatDate(day);
                      const dayItems = itemsByDate[dateStr] || [];
                      const isToday = dateStr === today;
                      const isPast = dateStr < today;

                      // Get unique category colors for dots (max 4)
                      const dotColors = [...new Set(dayItems.map(i => i.color || CATEGORY_COLORS[i.category] || '#9E9E9E'))].slice(0, 4);

                      const tooltipText = dayItems.length > 0
                        ? dayItems.map(i => i.title).join('\n')
                        : undefined;

                      const cell = (
                        <Box
                          key={dateStr}
                          sx={{
                            textAlign: 'center',
                            py: 0.5,
                            px: 0.25,
                            borderRadius: 1,
                            minHeight: 44,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isToday ? 'primary.main' : 'transparent',
                            border: isToday ? 'none' : '1px solid',
                            borderColor: dayItems.length > 0 ? 'divider' : 'transparent',
                            opacity: isPast ? 0.5 : 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isToday ? 'bold' : 'normal',
                              color: isToday ? 'primary.contrastText' : 'text.primary',
                              fontSize: '0.8rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {day.getDate()}
                          </Typography>
                          {dotColors.length > 0 && (
                            <Box sx={{ display: 'flex', gap: '2px', mt: 0.25 }}>
                              {dotColors.map((color, i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: '50%',
                                    backgroundColor: isToday ? 'primary.contrastText' : color,
                                    opacity: isToday ? 0.8 : 1,
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );

                      return tooltipText ? (
                        <Tooltip
                          key={dateStr}
                          title={
                            <Box>
                              {dayItems.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.25 }}>
                                  <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    backgroundColor: item.color || CATEGORY_COLORS[item.category] || '#9E9E9E',
                                    flexShrink: 0,
                                  }} />
                                  <Typography variant="caption">{item.title}</Typography>
                                </Box>
                              ))}
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          {cell}
                        </Tooltip>
                      ) : cell;
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default CalendarWidget;
