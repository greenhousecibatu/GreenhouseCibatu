// =============================================
// API Routes [P] (Paths/Routes)
// =============================================

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const AuthController = require('../controllers/authController');
const SolenoidController = require('../controllers/solenoidController');
const ScheduleController = require('../controllers/scheduleController');
const HistoryController = require('../controllers/historyController');
const NotificationController = require('../controllers/notificationController');
const WeatherController = require('../controllers/weatherController');

// ---- Public Routes (tanpa login) ----
router.post('/auth/login', AuthController.login);

// ---- Protected Routes (harus login) ----
router.get('/auth/verify', authMiddleware, AuthController.verify);

// Solenoids
router.get('/solenoids', authMiddleware, SolenoidController.getAll);
router.put('/solenoids/mode', authMiddleware, SolenoidController.setMode);
router.put('/solenoids/:id/toggle', authMiddleware, SolenoidController.toggle);

// Weather
router.get('/weather/latest', authMiddleware, WeatherController.getLatest);

// Schedules
router.get('/schedules', authMiddleware, ScheduleController.getAll);
router.post('/schedules', authMiddleware, ScheduleController.create);
router.put('/schedules/:id', authMiddleware, ScheduleController.update);
router.delete('/schedules/:id', authMiddleware, ScheduleController.delete);
router.put('/schedules/:id/toggle', authMiddleware, ScheduleController.toggleEnabled);

// History
router.get('/history', authMiddleware, HistoryController.getFiltered);
router.delete('/history', authMiddleware, HistoryController.clearAll);

// Notifications
router.get('/notifications', authMiddleware, NotificationController.getAll);
router.get('/notifications/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, NotificationController.markAsRead);
router.delete('/notifications/:id', authMiddleware, NotificationController.delete);
router.delete('/notifications', authMiddleware, NotificationController.clearAll);

module.exports = router;
