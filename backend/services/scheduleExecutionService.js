const HistoryModel = require('../models/historyModel');
const NotificationModel = require('../models/notificationModel');

/**
 * Records an automatic schedule when the ESP32 reports that it has started.
 * Keeping this in the backend makes recording independent of an open browser.
 */
const recordScheduleStart = async (payload = {}) => {
    const { type, name, method, duration } = payload;

    if (!['water', 'fertilizer'].includes(type)) {
        throw new Error('Invalid schedule execution type');
    }

    const typeName = type === 'water' ? 'Air' : 'Pupuk';
    const scheduleName = typeof name === 'string' && name.trim() ? name.trim() : 'Tanpa Nama';
    const scheduleMethod = typeof method === 'string' && method.trim() ? method.trim() : 'alarm';
    const durationMinutes = Number(duration);
    const durationStr = Number.isFinite(durationMinutes) && durationMinutes > 0
        ? `${durationMinutes} menit`
        : '—';

    const result = await HistoryModel.create({
        type,
        action: `Jadwal ${typeName} Dimulai: ${scheduleName}`,
        detail: `Otomatis via Jadwal (${scheduleMethod})`,
        duration: durationStr,
        status: 'success'
    });

    if (!result.isDuplicate) {
        await NotificationModel.create({
            type: 'success',
            title: `🌱 Jadwal ${typeName} Dimulai`,
            message: `"${scheduleName}" sedang berjalan. Durasi: ${durationStr}.`
        });
    }

    return result;
};

module.exports = { recordScheduleStart };
