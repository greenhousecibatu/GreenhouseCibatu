// =============================================
// Notification Model [M]
// =============================================

const db = require('../config/db');

const NotificationModel = {
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
        return rows;
    },

    getUnreadCount: async () => {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');
        return rows[0].count;
    },

    create: async (data) => {
        const { type, title, message } = data;
        const [result] = await db.query(
            'INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)',
            [type || 'info', title, message]
        );
        const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
        return rows[0];
    },

    markAsRead: async (id) => {
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        return true;
    },

    delete: async (id) => {
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        return true;
    },

    clearAll: async () => {
        await db.query('DELETE FROM notifications');
        return true;
    }
};

module.exports = NotificationModel;
