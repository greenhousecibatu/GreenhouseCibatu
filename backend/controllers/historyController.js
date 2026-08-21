// =============================================
// History Controller [C]
// =============================================

const HistoryModel = require('../models/historyModel');
const NotificationModel = require('../models/notificationModel');

const HistoryController = {
    getFiltered: async (req, res) => {
        try {
            const filter = req.query.filter || 'all';
            const data = await HistoryModel.getFiltered(filter);
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch history log' });
        }
    },
    
    clearAll: async (req, res) => {
        try {
            const count = await HistoryModel.deleteAll();
            res.json({ message: `Deleted ${count} history records` });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to clear history log' });
        }
    },

    create: async (req, res) => {
        try {
            const { type, name, method, duration } = req.body;
            const typeName = type === 'water' ? 'Air' : 'Pupuk';
            const durationStr = duration ? `${duration} menit` : '—';
            
            // Simpan riwayat (dengan deduplikasi)
            const result = await HistoryModel.create({
                type: type || 'water',
                action: `Jadwal ${typeName} Dimulai: ${name || 'Tanpa Nama'}`,
                detail: `Otomatis via Jadwal (${method || 'alarm'})`,
                duration: durationStr,
                status: 'success'
            });

            // Buat notifikasi HANYA jika riwayat baru benar-benar dibuat (bukan duplikat dari tab lain)
            if (!result.isDuplicate) {
                await NotificationModel.create({
                    type: 'success',
                    title: `🌱 Jadwal ${typeName} Dimulai`,
                    message: `"${name || 'Jadwal'}" sedang berjalan. Durasi: ${durationStr}.`
                });
            }

            res.json({ success: true, history: result.record });
        } catch (err) {
            console.error('Failed to create history:', err);
            res.status(500).json({ error: 'Failed to create history record' });
        }
    }
};

module.exports = HistoryController;
