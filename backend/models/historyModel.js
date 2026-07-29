// =============================================
// History Model [M]
// =============================================

const db = require('../config/db');

const HistoryModel = {
    getFiltered: async (filter = 'all') => {
        let query = 'SELECT * FROM history';
        const params = [];

        if (filter !== 'all') {
            query += ' WHERE type = ?';
            params.push(filter);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';
        const [rows] = await db.query(query, params);
        return rows;
    },

    create: async (data) => {
        const { type, action, detail, duration, status } = data;
        const [result] = await db.query(
            'INSERT INTO history (type, action, detail, duration, status) VALUES (?, ?, ?, ?, ?)',
            [type, action, detail, duration || '—', status || 'success']
        );
        const [rows] = await db.query('SELECT * FROM history WHERE id = ?', [result.insertId]);
        return rows[0];
    }
};

module.exports = HistoryModel;
