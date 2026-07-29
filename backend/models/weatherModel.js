// =============================================
// Weather Model [M]
// =============================================

const db = require('../config/db');

const WeatherModel = {
    saveReading: async (temperature, humidity) => {
        const [result] = await db.query(
            'INSERT INTO sensor_readings (temperature, humidity) VALUES (?, ?)',
            [temperature, humidity]
        );
        return { id: result.insertId, temperature, humidity };
    },

    getLatestReading: async () => {
        const [rows] = await db.query(
            'SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT 1'
        );
        if (rows.length === 0) {
            // Return fallback values if table is empty
            return { temperature: 24.0, humidity: 68.0, recorded_at: new Date() };
        }
        return rows[0];
    }
};

module.exports = WeatherModel;
