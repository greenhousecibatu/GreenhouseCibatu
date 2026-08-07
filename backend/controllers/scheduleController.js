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
            const { name, type, method = 'alarm', time, duration, days, interval_value } = req.body;
            if (!name || !type || !duration) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            if (method === 'alarm' && (!time || !days || !days.length)) {
                return res.status(400).json({ error: 'Alarm method requires time and days' });
            }
            if ((method === 'countdown' || method === 'interval') && !interval_value) {
                return res.status(400).json({ error: 'Countdown/Interval method requires interval_value' });
            }

            const schedule = await ScheduleModel.create({ name, type, method, time, duration, days, interval_value });

            // Create notification
            let timeString = time;
            if (method === 'countdown') timeString = `in ${interval_value} minutes`;
            if (method === 'interval') timeString = `every ${interval_value} minutes`;
            
            await NotificationModel.create({
                type: 'info',
                title: 'New Schedule Created',
                message: `"${name}" scheduled ${timeString} for ${duration} min.`
            });

            // Trigger MQTT sync
            MqttService.publishSchedules();

            res.status(201).json(schedule);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create schedule' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, method = 'alarm', time, duration, days, interval_value } = req.body;

            const updated = await ScheduleModel.update(id, { name, type, method, time, duration, days, interval_value });
            if (!updated) return res.status(404).json({ error: 'Schedule not found' });

            // Trigger MQTT sync
            MqttService.publishSchedules();

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

            // Trigger MQTT sync
            MqttService.publishSchedules();

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

            // Trigger MQTT sync
            MqttService.publishSchedules();

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to toggle schedule' });
        }
    }
};

module.exports = ScheduleController;
