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
    },

    deleteOldRecords: async () => {
        // Hapus data riwayat yang lebih lama dari 30 hari
        const [result] = await db.query('DELETE FROM history WHERE created_at < NOW() - INTERVAL 30 DAY');
        return result.affectedRows;
    },

    deleteAll: async () => {
        const [result] = await db.query('DELETE FROM history');
        return result.affectedRows;
    }
};

module.exports = HistoryModel;
