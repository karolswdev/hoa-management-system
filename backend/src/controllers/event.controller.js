const eventService = require('../services/event.service');

const listEvents = async (req, res, next) => {
  try {
    // Query parameters are already validated and sanitized by express-validator
    // and will be available in req.query
    const queryParams = req.query;

    const result = await eventService.getAllEvents(queryParams);

    res.status(200).json(result);
  } catch (error) {
    // Log the error for server-side inspection
    console.error('Error in listEvents controller:', error);

    // Check if the error is a known service layer error or a generic one
    if (error.message === 'Error fetching events from database.') {
      // Pass to a generic error handler or return a 500
      // For now, let's assume a generic error handler will catch it
      // or we can send a 500 directly.
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    // For other types of errors, or if you want more specific error handling
    // you can add more checks here.
    
    // Fallback to a generic 500 error if not handled specifically
    // and not already sent by a more specific catch.
    // This next(error) will typically be caught by a global error handler in app.js
    next(error); 
  }
};

const adminUpdateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const updateData = req.body;
    const adminUserId = req.user.id; // Assuming JWT middleware adds user to req

    const updatedEvent = await eventService.updateEvent(eventId, updateData, adminUserId);
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(`Error in adminUpdateEvent controller for event ${req.params.id}:`, error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error); // Pass to global error handler
  }
};

const adminDeleteEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const adminUserId = req.user.id; // Assuming JWT middleware adds user to req

    await eventService.deleteEvent(eventId, adminUserId);
    res.status(204).send();
  } catch (error) {
    console.error(`Error in adminDeleteEvent controller for event ${req.params.id}:`, error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error); // Pass to global error handler
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, event_date, location } = req.body;
    const adminUserId = req.user.id; // Assuming JWT middleware adds user to req

    const eventData = { title, description, event_date, location };
    const newEvent = await eventService.createEvent(eventData, adminUserId);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error in createEvent controller:', error);
    // If the service layer threw an error with a statusCode, use it
    if (error.statusCode) {
      // Construct a more informative error response if service provides details
      const errorResponse = { error: error.message };
      if (error.errors) { // For validation errors from service
        errorResponse.details = error.errors;
      }
      return res.status(error.statusCode).json(errorResponse);
    }
    // Pass to global error handler for unhandled/generic errors
    next(error);
  }
};

module.exports = {
  listEvents,
  adminUpdateEvent,
  adminDeleteEvent,
  createEvent,
};