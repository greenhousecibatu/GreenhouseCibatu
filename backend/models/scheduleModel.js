// =============================================
// Schedule Model [M]
// =============================================

const db = require('../config/db');

const ScheduleModel = {
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM schedules ORDER BY time ASC');
        return rows.map(r => ({
            ...r,
            days: typeof r.days === 'string' ? JSON.parse(r.days) : r.days
        }));
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM schedules WHERE id = ?', [id]);
        if (!rows[0]) return null;
        const schedule = rows[0];
        schedule.days = typeof schedule.days === 'string' ? JSON.parse(schedule.days) : schedule.days;
        return schedule;
    },

    create: async (data) => {
        const { name, type, method = 'alarm', time = null, duration, days = null, interval_value = null } = data;
        const [result] = await db.query(
            'INSERT INTO schedules (name, type, method, time, duration, days, interval_value, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [name, type, method, time, duration, days ? JSON.stringify(days) : null, interval_value]
        );
        return ScheduleModel.getById(result.insertId);
    },

    update: async (id, data) => {
        const { name, type, method = 'alarm', time = null, duration, days = null, interval_value = null } = data;
        await db.query(
            'UPDATE schedules SET name = ?, type = ?, method = ?, time = ?, duration = ?, days = ?, interval_value = ? WHERE id = ?',
            [name, type, method, time, duration, days ? JSON.stringify(days) : null, interval_value, id]
        );
        return ScheduleModel.getById(id);
    },

    delete: async (id) => {
        const record = await ScheduleModel.getById(id);
        if (!record) return null;
        await db.query('DELETE FROM schedules WHERE id = ?', [id]);
        return record;
    },

    toggleEnabled: async (id) => {
        const record = await ScheduleModel.getById(id);
        if (!record) return null;
        const newState = record.enabled ? 0 : 1;
        await db.query('UPDATE schedules SET enabled = ? WHERE id = ?', [newState, id]);
        return ScheduleModel.getById(id);
    }
};

module.exports = ScheduleModel;
