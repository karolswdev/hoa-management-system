const { Event, User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const auditService = require('./audit.service');

const getAllEvents = async (queryParams) => {
  const {
    status = 'upcoming', // Default status
    page = 1,
    limit = 10,
    sortBy = 'event_date', // Default sort by event_date (which is start_date in model)
    sortOrder: initialSortOrder, // Will be determined based on sortBy and status
  } = queryParams;

  // Determine default sortOrder based on sortBy and status
  let sortOrder = initialSortOrder;
  if (!sortOrder) {
    if (sortBy === 'event_date') {
      sortOrder = status === 'past' ? 'DESC' : 'ASC';
    } else if (sortBy === 'created_at') {
      sortOrder = 'DESC';
    } else { // title
      sortOrder = 'ASC';
    }
  }

  const offset = (page - 1) * limit;

  const whereClause = {};
  const now = new Date();

  if (status === 'upcoming') {
    whereClause.start_date = { [Op.gt]: now };
  } else if (status === 'past') {
    whereClause.start_date = { [Op.lte]: now };
  }
  
  // Adjust sortBy to match model field name if 'event_date' is used
  const actualSortBy = sortBy === 'event_date' ? 'start_date' : sortBy;

  try {
    const { count, rows } = await Event.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      order: [[actualSortBy, sortOrder.toUpperCase()]],
      limit,
      offset,
      distinct: true, // Important for correct count with includes
    });

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Map to desired response structure, especially event_date
    const formattedEvents = rows.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      event_date: event.start_date, // Map start_date to event_date
      end_date: event.end_date, // Add end_date to the response
      location: event.location,
      created_by: event.creator ? { id: event.creator.id, name: event.creator.name } : null,
      created_at: event.created_at,
      updated_at: event.updated_at,
    }));


    return {
      data: formattedEvents,
      pagination: {
        totalItems,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNextPage,
        hasPrevPage,
      },
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Error fetching events from database.');
  }
};

const updateEvent = async (eventId, updateData, adminUserId) => {
  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate start_date and end_date
    const { start_date, end_date, ...otherUpdateData } = updateData;
    let validatedStartDate = event.start_date;
    let validatedEndDate = event.end_date;

    if (start_date !== undefined) {
      validatedStartDate = new Date(start_date);
    }
    if (end_date !== undefined) {
      validatedEndDate = new Date(end_date);
    }

    // If both dates are present (either from input or existing event data), validate them
    if (validatedStartDate && validatedEndDate && validatedEndDate <= validatedStartDate) {
      const error = new Error('End date must be after start date.');
      error.statusCode = 400; // Bad Request
      throw error;
    }
    
    // Prepare fields for update, only including those provided in updateData
    const fieldsToUpdate = {};
    if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title;
    if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description;
    if (start_date !== undefined) fieldsToUpdate.start_date = validatedStartDate;
    if (end_date !== undefined) fieldsToUpdate.end_date = validatedEndDate;
    if (updateData.location !== undefined) fieldsToUpdate.location = updateData.location;


    // Only update if there are fields to update
    if (Object.keys(fieldsToUpdate).length > 0) {
        await event.update(fieldsToUpdate);
    }
    
    // Audit Logging
    try {
      await auditService.logAdminAction(adminUserId, 'event_update', { eventId, updatedFields: Object.keys(fieldsToUpdate) });
    } catch (auditError) {
      console.error('Failed to log admin action for event_update:', auditError);
    }

    // Fetch the updated event with creator info to match getAllEvents structure
    const updatedEventWithCreator = await Event.findByPk(eventId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
    });
    
    return {
        id: updatedEventWithCreator.id,
        title: updatedEventWithCreator.title,
        description: updatedEventWithCreator.description,
        event_date: updatedEventWithCreator.start_date, // Map start_date to event_date
        end_date: updatedEventWithCreator.end_date,
        location: updatedEventWithCreator.location,
        created_by: updatedEventWithCreator.creator ? { id: updatedEventWithCreator.creator.id, name: updatedEventWithCreator.creator.name } : null,
        created_at: updatedEventWithCreator.created_at,
        updated_at: updatedEventWithCreator.updated_at,
      };

  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    if (!error.statusCode) { // Default to 500 if no specific status code is set
        error.statusCode = 500;
        error.message = 'Error updating event in database.';
    }
    throw error;
  }
};

const deleteEvent = async (eventId, adminUserId) => {
  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    await event.destroy();

    // Audit Logging
    try {
      await auditService.logAdminAction(adminUserId, 'event_delete', { eventId });
    } catch (auditError) {
      console.error('Failed to log admin action for event_delete:', auditError);
    }

  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    if (!error.statusCode) { // Default to 500 if no specific status code is set
        error.statusCode = 500;
        error.message = 'Error deleting event from database.';
    }
    throw error;
  }
};


const createEvent = async (eventData, adminUserId) => {
  const { title, description, event_date, location } = eventData;

  try {
    // Assumption: event_date from request maps to start_date.
    // Assumption: end_date is set to start_date as it's NOT NULL in DB but not in US14 request.
    const newEventRecord = await Event.create({
      title,
      description,
      start_date: event_date,
      end_date: event_date, // Setting end_date same as start_date
      location,
      created_by: adminUserId,
    });

    // Audit Logging
    try {
      await auditService.logAdminAction(adminUserId, 'event_create', { eventId: newEventRecord.id, title: newEventRecord.title });
    } catch (auditError) {
      console.error('Failed to log admin action for event_create:', auditError);
    }

    // Fetch the event again to include creator details for a consistent response structure
    const populatedEvent = await Event.findByPk(newEventRecord.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Format the response to match the User Story and other event service responses
    return {
      id: populatedEvent.id,
      title: populatedEvent.title,
      description: populatedEvent.description,
      event_date: populatedEvent.start_date, // Map start_date back to event_date for response
      end_date: populatedEvent.end_date, // Add end_date to the response
      location: populatedEvent.location,
      created_by: populatedEvent.creator ? { id: populatedEvent.creator.id, name: populatedEvent.creator.name } : null,
      createdAt: populatedEvent.created_at,
      updatedAt: populatedEvent.updated_at,
    };

  } catch (error) {
    console.error(`Error creating event:`, error);
    // Allowing Sequelize validation errors to propagate with their structure,
    // or re-throwing a generic error for other DB issues.
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const simplifiedErrors = error.errors.map(e => ({ message: e.message, path: e.path }));
        const err = new Error('Validation failed or constraint violation.');
        err.statusCode = 400; // Bad Request
        err.errors = simplifiedErrors;
        throw err;
    }
    
    const serviceError = new Error('Error creating event in database.');
    serviceError.statusCode = error.statusCode || 500;
    throw serviceError;
  }
};

module.exports = {
  getAllEvents,
  updateEvent,
  deleteEvent,
  createEvent,
};