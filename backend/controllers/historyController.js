// =============================================
// History Controller [C]
// =============================================

const HistoryModel = require('../models/historyModel');

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
    }
};

module.exports = HistoryController;
