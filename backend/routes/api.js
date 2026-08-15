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

// ---- Public Routes (tanpa login) ----
router.post('/auth/login', AuthController.login);

// ---- Protected Routes (harus login) ----
router.get('/auth/verify', authMiddleware, AuthController.verify);

// Solenoids
router.get('/solenoids', authMiddleware, SolenoidController.getAll);
router.put('/solenoids/mode', authMiddleware, SolenoidController.setMode);
router.put('/solenoids/:id/toggle', authMiddleware, SolenoidController.toggle);

// Schedules
router.get('/schedules', authMiddleware, ScheduleController.getAll);
router.post('/schedules', authMiddleware, ScheduleController.create);
router.put('/schedules/:id', authMiddleware, ScheduleController.update);
router.delete('/schedules/:id', authMiddleware, ScheduleController.delete);
router.put('/schedules/:id/toggle', authMiddleware, ScheduleController.toggleEnabled);

// History
router.get('/history', authMiddleware, HistoryController.getFiltered);
router.post('/history', authMiddleware, HistoryController.create);
router.delete('/history', authMiddleware, HistoryController.clearAll);

// Notifications
router.get('/notifications', authMiddleware, NotificationController.getAll);
router.get('/notifications/unread-count', authMiddleware, NotificationController.getUnreadCount);
router.put('/notifications/:id/read', authMiddleware, NotificationController.markAsRead);
router.delete('/notifications/:id', authMiddleware, NotificationController.delete);
router.delete('/notifications', authMiddleware, NotificationController.clearAll);

// Vercel Cron Job Route
const HistoryModel = require('../models/historyModel');
router.get('/cron/cleanup', async (req, res) => {
    // Basic security to ensure only Vercel can trigger this
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const deletedCount = await HistoryModel.deleteOldRecords();
        res.status(200).json({ success: true, deleted: deletedCount });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
