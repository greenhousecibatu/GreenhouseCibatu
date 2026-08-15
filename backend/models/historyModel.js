// =============================================
// History Model [M] (MongoDB)
// =============================================

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    type: { type: String, required: true },
    action: { type: String, required: true },
    detail: { type: String, required: true },
    duration: { type: String, default: '—' },
    status: { type: String, default: 'success' },
    created_at: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

const HistoryModel = {
    getFiltered: async (filter = 'all') => {
        const query = filter !== 'all' ? { type: filter } : {};
        return await History.find(query).sort({ created_at: -1 }).limit(50).lean();
    },

    create: async (data) => {
        const { type, action, detail, duration, status } = data;

        // [BUG FIX] Deduplikasi: Cek apakah ada record yang persis sama dalam 10 detik terakhir
        // Ini mencegah duplikat jika multiple browser tabs terbuka dan mengirim POST /history bersamaan
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const duplicate = await History.findOne({
            action,
            detail,
            created_at: { $gte: tenSecondsAgo }
        });

        if (duplicate) {
            console.log('Deduplikasi: Mengabaikan riwayat ganda', action);
            return { record: duplicate, isDuplicate: true }; // Kembalikan yang sudah ada, jangan buat baru
        }

        const record = new History({
            type,
            action,
            detail,
            duration: duration || '—',
            status: status || 'success'
        });
        const saved = await record.save();
        return { record: saved, isDuplicate: false };
    },

    deleteOldRecords: async () => {
        // Hapus data riwayat yang lebih lama dari 30 hari
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await History.deleteMany({ created_at: { $lt: thirtyDaysAgo } });
        return result.deletedCount;
    },

    deleteAll: async () => {
        const result = await History.deleteMany({});
        return result.deletedCount;
    }
};

module.exports = HistoryModel;
