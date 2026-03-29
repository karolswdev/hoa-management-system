import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
  const distance = formatDistanceToNow(date, { addSuffix: true });
  return distance;
}

export function formatDateLong(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy');
}
