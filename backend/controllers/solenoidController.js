// =============================================
// Solenoid Controller [C]
// =============================================

const SolenoidModel = require('../models/solenoidModel');
const HistoryModel = require('../models/historyModel');
const NotificationModel = require('../models/notificationModel');

const SolenoidController = {
    getAll: async (req, res) => {
        try {
            const data = await SolenoidModel.getAll();
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch solenoids' });
        }
    },

    toggle: async (req, res) => {
        try {
            const { id } = req.params;
            const solenoid = await SolenoidModel.getById(id);
            if (!solenoid) return res.status(404).json({ error: 'Solenoid not found' });

            const newState = solenoid.is_active ? 0 : 1;
            const updated = await SolenoidModel.updateState(id, newState);

            // Log event to history
            const action = `${solenoid.name} ${newState ? 'Opened' : 'Closed'}`;
            const detail = `Manual ${newState ? 'ON' : 'OFF'} toggle`;
            await HistoryModel.create({
                type: solenoid.type,
                action,
                detail,
                duration: '—',
                status: 'success'
            });

            // Create notification if solenoid opened
            if (newState) {
                await NotificationModel.create({
                    type: 'success',
                    title: `${solenoid.name} Opened`,
                    message: `The ${solenoid.type} solenoid has been manually activated.`
                });
            }

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to toggle solenoid' });
        }
    }
};

module.exports = SolenoidController;
