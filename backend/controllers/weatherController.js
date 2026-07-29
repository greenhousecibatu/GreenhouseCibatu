// =============================================
// Weather Controller [C]
// =============================================

const WeatherModel = require('../models/weatherModel');

const WeatherController = {
    getLatest: async (req, res) => {
        try {
            const data = await WeatherModel.getLatestReading();
            res.json(data);
        } catch (err) {
            console.error('Error fetching latest weather:', err);
            res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    }
};

module.exports = WeatherController;
