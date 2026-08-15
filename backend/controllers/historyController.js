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
            
            // Simpan riwayat
            const historyData = await HistoryModel.create({
                type: type || 'water',
                action: `Jadwal ${typeName} Selesai: ${name || 'Tanpa Nama'}`,
                detail: `Otomatis via Jadwal (${method || 'alarm'})`,
                duration: durationStr,
                status: 'success'
            });

            // Buat notifikasi
            await NotificationModel.create({
                type: 'success',
                title: `✅ Jadwal ${typeName} Selesai`,
                message: `"${name || 'Jadwal'}" berhasil dijalankan selama ${durationStr}.`
            });

            res.json({ success: true, history: historyData });
        } catch (err) {
            console.error('Failed to create history:', err);
            res.status(500).json({ error: 'Failed to create history record' });
        }
    }
};

module.exports = HistoryController;
