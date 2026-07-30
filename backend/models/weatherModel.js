// =============================================
// Weather Model [M] (MongoDB)
// =============================================

// Weather logic is currently disabled due to removing Open-Meteo fetching.
// Keeping this file as a stub if needed later.

const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    recorded_at: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', weatherSchema);

const WeatherModel = {
    saveReading: async (temperature, humidity) => {
        const record = new Weather({ temperature, humidity });
        await record.save();
        return record.toObject();
    },

    getLatestReading: async () => {
        const latest = await Weather.findOne().sort({ recorded_at: -1 }).lean();
        if (!latest) {
            return { temperature: 24.0, humidity: 68.0, recorded_at: new Date() };
        }
        return latest;
    }
};

module.exports = WeatherModel;
