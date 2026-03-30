const { CalendarEntry, CalendarEntryException, User } = require('../../models');
const auditService = require('./audit.service');

const VALID_CATEGORIES = [
  'trash', 'recycling', 'yard_waste', 'meeting', 'dues',
  'community', 'holiday', 'other'
];

/**
 * Expand a recurring calendar entry into individual occurrence dates
 * within the given range [rangeStart, rangeEnd].
 * Returns an array of date strings (YYYY-MM-DD).
 */
function expandRecurrence(entry, rangeStart, rangeEnd) {
  if (!entry.is_recurring) {
    // Non-recurring: just return the start_date if it falls in range
    const d = entry.start_date;
    if (d >= rangeStart && d <= rangeEnd) {
      return [d];
    }
    return [];
  }

  const dates = [];
  const start = parseDate(rangeStart > entry.start_date ? rangeStart : entry.start_date);
  const end = parseDate(entry.recurrence_end && entry.recurrence_end < rangeEnd ? entry.recurrence_end : rangeEnd);

  switch (entry.frequency) {
    case 'daily':
      expandDaily(start, end, entry, dates);
      break;
    case 'weekly':
      expandWeekly(start, end, entry, dates, 1);
      break;
    case 'biweekly':
      expandBiweekly(start, end, entry, dates);
      break;
    case 'monthly':
      expandMonthly(start, end, entry, dates);
      break;
    case 'quarterly':
      expandQuarterly(start, end, entry, dates);
      break;
    case 'yearly':
      expandYearly(start, end, entry, dates);
      break;
  }

  return dates;
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isInSeason(date, entry) {
  if (!entry.seasonal_start && !entry.seasonal_end) return true;
  const month = date.getMonth() + 1;
  if (entry.seasonal_start && entry.seasonal_end) {
    if (entry.seasonal_start <= entry.seasonal_end) {
      return month >= entry.seasonal_start && month <= entry.seasonal_end;
    }
    // Wraps around year (e.g., Nov-Feb)
    return month >= entry.seasonal_start || month <= entry.seasonal_end;
  }
  if (entry.seasonal_start) return month >= entry.seasonal_start;
  if (entry.seasonal_end) return month <= entry.seasonal_end;
  return true;
}

function pushIfInSeason(date, entry, dates) {
  if (isInSeason(date, entry)) {
    dates.push(formatDate(date));
  }
}

function expandDaily(start, end, entry, dates) {
  const current = new Date(start);
  while (current <= end) {
    pushIfInSeason(current, entry, dates);
    current.setDate(current.getDate() + 1);
  }
}

function expandWeekly(start, end, entry, dates) {
  const dow = entry.day_of_week;
  const current = new Date(start);
  // Advance to first matching day of week
  while (current.getDay() !== dow && current <= end) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= end) {
    pushIfInSeason(current, entry, dates);
    current.setDate(current.getDate() + 7);
  }
}

function expandBiweekly(start, end, entry, dates) {
  const dow = entry.day_of_week;
  // Anchor biweekly from the entry's start_date
  const anchor = parseDate(entry.start_date);
  while (anchor.getDay() !== dow) {
    anchor.setDate(anchor.getDate() + 1);
  }

  const current = new Date(anchor);
  // Advance to range start
  while (current < start) {
    current.setDate(current.getDate() + 14);
  }
  while (current <= end) {
    pushIfInSeason(current, entry, dates);
    current.setDate(current.getDate() + 14);
  }
}

function expandMonthly(start, end, entry, dates) {
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    let date = null;

    if (entry.day_of_week !== null && entry.day_of_week !== undefined && entry.week_of_month !== null && entry.week_of_month !== undefined) {
      // "Nth weekday of month" (e.g., first Thursday)
      date = getNthWeekdayOfMonth(current.getFullYear(), current.getMonth(), entry.day_of_week, entry.week_of_month);
    } else if (entry.day_of_month) {
      // Specific day of month
      const day = Math.min(entry.day_of_month, daysInMonth(current.getFullYear(), current.getMonth()));
      date = new Date(current.getFullYear(), current.getMonth(), day);
    }

    if (date && date >= start && date <= end) {
      pushIfInSeason(date, entry, dates);
    }

    current.setMonth(current.getMonth() + 1);
  }
}

function expandQuarterly(start, end, entry, dates) {
  // Quarterly: Jan, Apr, Jul, Oct (months 0, 3, 6, 9)
  const quarterMonths = [0, 3, 6, 9];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    for (const month of quarterMonths) {
      const day = entry.day_of_month || 1;
      const actualDay = Math.min(day, daysInMonth(year, month));
      const date = new Date(year, month, actualDay);
      if (date >= start && date <= end) {
        pushIfInSeason(date, entry, dates);
      }
    }
  }
}

function expandYearly(start, end, entry, dates) {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const month = (entry.month_of_year || 1) - 1; // 1-indexed to 0-indexed
  const day = entry.day_of_month || 1;

  for (let year = startYear; year <= endYear; year++) {
    const actualDay = Math.min(day, daysInMonth(year, month));
    const date = new Date(year, month, actualDay);
    if (date >= start && date <= end) {
      pushIfInSeason(date, entry, dates);
    }
  }
}

function getNthWeekdayOfMonth(year, month, dayOfWeek, weekOfMonth) {
  if (weekOfMonth === -1) {
    // Last occurrence of this weekday
    const lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== dayOfWeek) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    return lastDay;
  }

  // Find the first occurrence of this weekday
  const first = new Date(year, month, 1);
  while (first.getDay() !== dayOfWeek) {
    first.setDate(first.getDate() + 1);
  }
  // Advance to the Nth week
  first.setDate(first.getDate() + (weekOfMonth - 1) * 7);

  // Verify still in the same month
  if (first.getMonth() !== month) return null;
  return first;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function buildCalendarItem(entry, dateStr, exception) {
  const item = {
    id: entry.is_recurring ? `calendar-${entry.id}-${dateStr}` : `calendar-${entry.id}`,
    source: 'calendar_entry',
    sourceId: entry.id,
    title: (exception && exception.override_title) || entry.title,
    description: entry.description,
    category: entry.category,
    color: entry.color,
    allDay: entry.all_day,
    isRecurring: entry.is_recurring,
  };

  if (entry.all_day) {
    item.start = dateStr;
    if (entry.end_date && !entry.is_recurring) {
      item.end = entry.end_date;
    }
  } else {
    const time = (exception && exception.override_time) || entry.start_time || '00:00';
    item.start = `${dateStr}T${time}:00`;
    if (entry.end_time) {
      item.end = `${dateStr}T${entry.end_time}:00`;
    }
  }

  if (exception && exception.note) {
    item.note = exception.note;
  }

  return item;
}

/**
 * Expand a calendar entry into calendar items for a date range,
 * applying exceptions. Returns array of calendar item objects.
 */
function expandEntryToItems(entry, rangeStart, rangeEnd) {
  const occurrences = expandRecurrence(entry, rangeStart, rangeEnd);
  const exceptions = (entry.exceptions || []).reduce((map, ex) => {
    map[ex.exception_date] = ex;
    return map;
  }, {});

  const items = [];
  for (const dateStr of occurrences) {
    const exception = exceptions[dateStr];

    if (exception && exception.is_cancelled) {
      // If moved (cancelled + override_date), add the moved occurrence
      if (exception.override_date) {
        const movedDate = exception.override_date;
        const item = buildCalendarItem(entry, movedDate, exception);
        item.id = entry.is_recurring ? `calendar-${entry.id}-${movedDate}` : `calendar-${entry.id}`;
        if (exception.note) {
          item.note = exception.note;
        } else {
          item.note = `Moved from ${dateStr}`;
        }
        items.push(item);
      }
      continue;
    }

    const item = buildCalendarItem(entry, dateStr, exception);
    items.push(item);
  }

  return items;
}

// --- CRUD Operations ---

const includeOptions = [
  {
    model: User,
    as: 'creator',
    attributes: ['id', 'name'],
  },
  {
    model: CalendarEntryException,
    as: 'exceptions',
  },
];

async function listEntries(queryParams) {
  const {
    page = 1,
    limit = 20,
    category,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = queryParams;

  const offset = (page - 1) * limit;
  const whereClause = {};
  if (category) {
    whereClause.category = category;
  }

  const { count, rows } = await CalendarEntry.findAndCountAll({
    where: whereClause,
    include: includeOptions,
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit,
    offset,
    distinct: true,
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      limit: parseInt(limit, 10),
    },
  };
}

async function getEntry(id) {
  const entry = await CalendarEntry.findByPk(id, {
    include: includeOptions,
  });
  if (!entry) {
    const error = new Error('Calendar entry not found');
    error.statusCode = 404;
    throw error;
  }
  return entry;
}

async function createEntry(data, adminUserId) {
  const entry = await CalendarEntry.create({
    ...data,
    created_by: adminUserId,
  });

  try {
    await auditService.logAdminAction(adminUserId, 'calendar_entry_create', {
      entryId: entry.id,
      title: entry.title,
    });
  } catch (auditError) {
    console.error('Failed to log admin action for calendar_entry_create:', auditError);
  }

  return getEntry(entry.id);
}

async function updateEntry(id, data, adminUserId) {
  const entry = await CalendarEntry.findByPk(id);
  if (!entry) {
    const error = new Error('Calendar entry not found');
    error.statusCode = 404;
    throw error;
  }

  const fieldsToUpdate = {};
  const allowedFields = [
    'title', 'description', 'category', 'color', 'all_day',
    'start_date', 'end_date', 'start_time', 'end_time',
    'is_recurring', 'frequency', 'day_of_week', 'week_of_month',
    'month_of_year', 'day_of_month', 'recurrence_end',
    'seasonal_start', 'seasonal_end',
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fieldsToUpdate[field] = data[field];
    }
  }

  if (Object.keys(fieldsToUpdate).length > 0) {
    await entry.update(fieldsToUpdate);
  }

  try {
    await auditService.logAdminAction(adminUserId, 'calendar_entry_update', {
      entryId: id,
      updatedFields: Object.keys(fieldsToUpdate),
    });
  } catch (auditError) {
    console.error('Failed to log admin action for calendar_entry_update:', auditError);
  }

  return getEntry(id);
}

async function deleteEntry(id, adminUserId) {
  const entry = await CalendarEntry.findByPk(id);
  if (!entry) {
    const error = new Error('Calendar entry not found');
    error.statusCode = 404;
    throw error;
  }

  const title = entry.title;
  await entry.destroy();

  try {
    await auditService.logAdminAction(adminUserId, 'calendar_entry_delete', {
      entryId: id,
      title,
    });
  } catch (auditError) {
    console.error('Failed to log admin action for calendar_entry_delete:', auditError);
  }
}

async function addException(entryId, data, adminUserId) {
  const entry = await CalendarEntry.findByPk(entryId);
  if (!entry) {
    const error = new Error('Calendar entry not found');
    error.statusCode = 404;
    throw error;
  }

  const exception = await CalendarEntryException.create({
    calendar_entry_id: entryId,
    exception_date: data.exception_date,
    is_cancelled: data.is_cancelled !== undefined ? data.is_cancelled : true,
    override_date: data.override_date || null,
    override_title: data.override_title || null,
    override_time: data.override_time || null,
    note: data.note || null,
    created_by: adminUserId,
  });

  try {
    await auditService.logAdminAction(adminUserId, 'calendar_exception_create', {
      entryId,
      exceptionId: exception.id,
      exceptionDate: data.exception_date,
    });
  } catch (auditError) {
    console.error('Failed to log admin action for calendar_exception_create:', auditError);
  }

  return exception;
}

async function removeException(exceptionId, adminUserId) {
  const exception = await CalendarEntryException.findByPk(exceptionId);
  if (!exception) {
    const error = new Error('Calendar entry exception not found');
    error.statusCode = 404;
    throw error;
  }

  const entryId = exception.calendar_entry_id;
  await exception.destroy();

  try {
    await auditService.logAdminAction(adminUserId, 'calendar_exception_delete', {
      entryId,
      exceptionId,
    });
  } catch (auditError) {
    console.error('Failed to log admin action for calendar_exception_delete:', auditError);
  }
}

/**
 * Get the next N occurrences of a calendar entry starting from today.
 */
function getNextOccurrences(entry, count = 5) {
  const today = formatDate(new Date());
  // Look up to 2 years ahead to find occurrences
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);
  const endStr = formatDate(futureDate);

  const allDates = expandRecurrence(entry, today, endStr);
  return allDates.slice(0, count);
}

module.exports = {
  expandRecurrence,
  expandEntryToItems,
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  addException,
  removeException,
  getNextOccurrences,
  VALID_CATEGORIES,
};
