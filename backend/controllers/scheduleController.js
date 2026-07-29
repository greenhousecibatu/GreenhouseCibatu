// =============================================
// Schedule Controller [C]
// =============================================

const ScheduleModel = require('../models/scheduleModel');
const NotificationModel = require('../models/notificationModel');

const ScheduleController = {
    getAll: async (req, res) => {
        try {
            const data = await ScheduleModel.getAll();
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch schedules' });
        }
    },

    create: async (req, res) => {
        try {
            const { name, type, time, duration, days } = req.body;
            if (!name || !type || !time || !duration || !days || !days.length) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const schedule = await ScheduleModel.create({ name, type, time, duration, days });

            // Create notification
            await NotificationModel.create({
                type: 'info',
                title: 'New Schedule Created',
                message: `"${name}" scheduled at ${time} for ${duration} min.`
            });

            res.status(201).json(schedule);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create schedule' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, time, duration, days } = req.body;

            const updated = await ScheduleModel.update(id, { name, type, time, duration, days });
            if (!updated) return res.status(404).json({ error: 'Schedule not found' });

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update schedule' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await ScheduleModel.delete(id);
            if (!deleted) return res.status(404).json({ error: 'Schedule not found' });

            res.json({ message: 'Schedule deleted', deleted });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to delete schedule' });
        }
    },

    toggleEnabled: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await ScheduleModel.toggleEnabled(id);
            if (!updated) return res.status(404).json({ error: 'Schedule not found' });

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to toggle schedule' });
        }
    }
};

module.exports = ScheduleController;
