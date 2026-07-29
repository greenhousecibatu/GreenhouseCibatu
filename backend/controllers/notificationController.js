// =============================================
// Notification Controller [C]
// =============================================

const NotificationModel = require('../models/notificationModel');

const NotificationController = {
    getAll: async (req, res) => {
        try {
            const data = await NotificationModel.getAll();
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    getUnreadCount: async (req, res) => {
        try {
            const count = await NotificationModel.getUnreadCount();
            res.json({ count });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch unread count' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            await NotificationModel.markAsRead(id);
            res.json({ message: 'Marked as read' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await NotificationModel.delete(id);
            res.json({ message: 'Notification dismissed' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to dismiss notification' });
        }
    },

    clearAll: async (req, res) => {
        try {
            await NotificationModel.clearAll();
            res.json({ message: 'All notifications cleared' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to clear all notifications' });
        }
    }
};

module.exports = NotificationController;
