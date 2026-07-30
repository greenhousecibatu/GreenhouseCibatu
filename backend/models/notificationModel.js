// =============================================
// Notification Model [M] (MongoDB)
// =============================================

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { type: String, default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

const NotificationModel = {
    getAll: async () => {
        return await Notification.find().sort({ created_at: -1 }).limit(20).lean();
    },

    getUnreadCount: async () => {
        return await Notification.countDocuments({ is_read: false });
    },

    create: async (data) => {
        const { type, title, message } = data;
        const record = new Notification({
            type: type || 'info',
            title,
            message
        });
        await record.save();
        return record.toObject();
    },

    markAsRead: async (id) => {
        await Notification.findByIdAndUpdate(id, { is_read: true });
        return true;
    },

    delete: async (id) => {
        await Notification.findByIdAndDelete(id);
        return true;
    },

    clearAll: async () => {
        await Notification.deleteMany({});
        return true;
    }
};

module.exports = NotificationModel;
