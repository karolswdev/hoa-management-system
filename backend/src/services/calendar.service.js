const { Event, Poll, Announcement, CalendarEntry, CalendarEntryException, User } = require('../../models');
const { Op } = require('sequelize');
const calendarEntryService = require('./calendarEntry.service');

// Default colors for auto-aggregated sources
const SOURCE_COLORS = {
  event: '#2196F3',
  poll: '#FF9800',
  announcement: '#607D8B',
};

/**
 * Get unified calendar items from all sources for a date range.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string[]} [categories] - optional filter
 */
async function getCalendarItems(startDate, endDate, categories) {
  const categorySet = categories ? new Set(categories) : null;

  const results = await Promise.all([
    categorySet === null || categorySet.has('event')
      ? getEventItems(startDate, endDate)
      : [],
    categorySet === null || categorySet.has('poll')
      ? getPollItems(startDate, endDate)
      : [],
    categorySet === null || categorySet.has('announcement')
      ? getAnnouncementItems(startDate, endDate)
      : [],
    getCalendarEntryItems(startDate, endDate, categorySet),
  ]);

  const items = results.flat();

  // Sort by start date
  items.sort((a, b) => {
    const aDate = a.start || '';
    const bDate = b.start || '';
    return aDate.localeCompare(bDate);
  });

  return { items };
}

async function getEventItems(startDate, endDate) {
  const events = await Event.findAll({
    where: {
      start_date: { [Op.lte]: `${endDate}T23:59:59` },
      end_date: { [Op.gte]: `${startDate}T00:00:00` },
    },
    include: [{
      model: User,
      as: 'creator',
      attributes: ['id', 'name'],
    }],
  });

  return events.map(event => ({
    id: `event-${event.id}`,
    source: 'event',
    sourceId: event.id,
    title: event.title,
    description: event.description,
    start: event.start_date instanceof Date
      ? event.start_date.toISOString()
      : event.start_date,
    end: event.end_date instanceof Date
      ? event.end_date.toISOString()
      : event.end_date,
    allDay: false,
    category: 'event',
    color: SOURCE_COLORS.event,
    location: event.location,
  }));
}

async function getPollItems(startDate, endDate) {
  const polls = await Poll.findAll({
    where: {
      [Op.or]: [
        // Poll starts within range
        {
          start_at: {
            [Op.gte]: `${startDate}T00:00:00`,
            [Op.lte]: `${endDate}T23:59:59`,
          },
        },
        // Poll ends within range
        {
          end_at: {
            [Op.gte]: `${startDate}T00:00:00`,
            [Op.lte]: `${endDate}T23:59:59`,
          },
        },
      ],
    },
  });

  const items = [];
  for (const poll of polls) {
    const startStr = poll.start_at instanceof Date
      ? poll.start_at.toISOString()
      : poll.start_at;
    const endStr = poll.end_at instanceof Date
      ? poll.end_at.toISOString()
      : poll.end_at;

    // "Voting Opens" marker
    if (startStr >= `${startDate}T00:00:00` && startStr <= `${endDate}T23:59:59`) {
      items.push({
        id: `poll-${poll.id}-start`,
        source: 'poll',
        sourceId: poll.id,
        title: `${poll.title} — Voting Opens`,
        start: startStr,
        allDay: false,
        category: 'poll',
        color: SOURCE_COLORS.poll,
      });
    }

    // "Voting Closes" marker
    if (endStr >= `${startDate}T00:00:00` && endStr <= `${endDate}T23:59:59`) {
      items.push({
        id: `poll-${poll.id}-end`,
        source: 'poll',
        sourceId: poll.id,
        title: `${poll.title} — Voting Closes`,
        start: endStr,
        allDay: false,
        category: 'poll',
        color: SOURCE_COLORS.poll,
      });
    }
  }

  return items;
}

async function getAnnouncementItems(startDate, endDate) {
  const announcements = await Announcement.findAll({
    where: {
      expires_at: {
        [Op.not]: null,
        [Op.gte]: `${startDate}T00:00:00`,
        [Op.lte]: `${endDate}T23:59:59`,
      },
    },
  });

  return announcements.map(ann => ({
    id: `announcement-${ann.id}`,
    source: 'announcement',
    sourceId: ann.id,
    title: `${ann.title} — Deadline`,
    start: ann.expires_at instanceof Date
      ? ann.expires_at.toISOString()
      : ann.expires_at,
    allDay: false,
    category: 'announcement',
    color: SOURCE_COLORS.announcement,
  }));
}

async function getCalendarEntryItems(startDate, endDate, categorySet) {
  const entries = await CalendarEntry.findAll({
    include: [{
      model: CalendarEntryException,
      as: 'exceptions',
    }],
  });

  const items = [];
  for (const entry of entries) {
    // Filter by category if specified (skip source-level categories like event/poll/announcement)
    if (categorySet && !categorySet.has(entry.category)) continue;

    const entryItems = calendarEntryService.expandEntryToItems(entry, startDate, endDate);
    items.push(...entryItems);
  }

  return items;
}

module.exports = {
  getCalendarItems,
};
