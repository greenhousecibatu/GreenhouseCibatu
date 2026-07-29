// =============================================
// Solenoid Model [M]
// =============================================

const db = require('../config/db');

const SolenoidModel = {
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM solenoids ORDER BY id');
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM solenoids WHERE id = ?', [id]);
        return rows[0];
    },

    updateState: async (id, is_active) => {
        await db.query('UPDATE solenoids SET is_active = ? WHERE id = ?', [is_active, id]);
        return SolenoidModel.getById(id);
    }
};

module.exports = SolenoidModel;
