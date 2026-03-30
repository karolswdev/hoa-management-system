const calendarService = require('../services/calendar.service');

const getCalendarItems = async (req, res, next) => {
  try {
    const { start, end, categories } = req.query;
    const startDate = start.split('T')[0]; // Normalize to YYYY-MM-DD
    const endDate = end.split('T')[0];
    const categoryList = categories ? categories.split(',').map(c => c.trim()) : null;

    const result = await calendarService.getCalendarItems(startDate, endDate, categoryList);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getCalendarItems controller:', error);
    next(error);
  }
};

module.exports = {
  getCalendarItems,
};
