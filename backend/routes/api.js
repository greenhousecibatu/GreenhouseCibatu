// =============================================
// API Routes [P] (Paths/Routes)
// =============================================

const express = require('express');
const router = express.Router();

const SolenoidController = require('../controllers/solenoidController');
const ScheduleController = require('../controllers/scheduleController');
const HistoryController = require('../controllers/historyController');
const NotificationController = require('../controllers/notificationController');
const WeatherController = require('../controllers/weatherController');

// Solenoids
router.get('/solenoids', SolenoidController.getAll);
router.put('/solenoids/:id/toggle', SolenoidController.toggle);

// Weather
router.get('/weather/latest', WeatherController.getLatest);


// Schedules
router.get('/schedules', ScheduleController.getAll);
router.post('/schedules', ScheduleController.create);
router.put('/schedules/:id', ScheduleController.update);
router.delete('/schedules/:id', ScheduleController.delete);
router.put('/schedules/:id/toggle', ScheduleController.toggleEnabled);

// History
router.get('/history', HistoryController.getFiltered);

// Notifications
router.get('/notifications', NotificationController.getAll);
router.get('/notifications/unread-count', NotificationController.getUnreadCount);
router.put('/notifications/:id/read', NotificationController.markAsRead);
router.delete('/notifications/:id', NotificationController.delete);
router.delete('/notifications', NotificationController.clearAll);

module.exports = router;
