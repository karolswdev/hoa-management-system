const calendarEntryService = require('../services/calendarEntry.service');

const listEntries = async (req, res, next) => {
  try {
    const result = await calendarEntryService.listEntries(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in listEntries controller:', error);
    next(error);
  }
};

const getEntry = async (req, res, next) => {
  try {
    const entry = await calendarEntryService.getEntry(req.params.id);
    res.status(200).json(entry);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const createEntry = async (req, res, next) => {
  try {
    const entry = await calendarEntryService.createEntry(req.body, req.user.id);
    res.status(201).json(entry);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const updateEntry = async (req, res, next) => {
  try {
    const entry = await calendarEntryService.updateEntry(req.params.id, req.body, req.user.id);
    res.status(200).json(entry);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    await calendarEntryService.deleteEntry(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const addException = async (req, res, next) => {
  try {
    const exception = await calendarEntryService.addException(req.params.id, req.body, req.user.id);
    res.status(201).json(exception);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const removeException = async (req, res, next) => {
  try {
    await calendarEntryService.removeException(req.params.exceptionId, req.user.id);
    res.status(204).send();
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const getNextOccurrences = async (req, res, next) => {
  try {
    const entry = await calendarEntryService.getEntry(req.params.id);
    const count = parseInt(req.query.count, 10) || 5;
    const occurrences = calendarEntryService.getNextOccurrences(entry, count);
    res.status(200).json({ occurrences });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

module.exports = {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  addException,
  removeException,
  getNextOccurrences,
};
