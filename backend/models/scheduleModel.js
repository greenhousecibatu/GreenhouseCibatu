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
        const { name, type, time, duration, days } = data;
        const [result] = await db.query(
            'INSERT INTO schedules (name, type, time, duration, days, enabled) VALUES (?, ?, ?, ?, ?, 1)',
            [name, type, time, duration, JSON.stringify(days)]
        );
        return ScheduleModel.getById(result.insertId);
    },

    update: async (id, data) => {
        const { name, type, time, duration, days } = data;
        await db.query(
            'UPDATE schedules SET name = ?, type = ?, time = ?, duration = ?, days = ? WHERE id = ?',
            [name, type, time, duration, JSON.stringify(days), id]
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
