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

    setMode: async (req, res) => {
        try {
            const { mode, duration } = req.body; // 'off', 'water', 'fertilizer'
            if (!['off', 'water', 'fertilizer'].includes(mode)) {
                return res.status(400).json({ error: 'Invalid mode' });
            }

            const solenoids = await SolenoidModel.getAll();
            const waterSol = solenoids.find(s => s.type === 'water');
            const fertilizerSol = solenoids.find(s => s.type === 'fertilizer');

            if (!waterSol || !fertilizerSol) {
                return res.status(404).json({ error: 'Solenoids not properly configured' });
            }

            let action = '';
            
            if (mode === 'off') {
                if (waterSol.is_active) await SolenoidModel.updateState(waterSol._id, false);
                if (fertilizerSol.is_active) await SolenoidModel.updateState(fertilizerSol._id, false);
                action = 'Semua Katup Dimatikan';
            } else if (mode === 'water') {
                if (fertilizerSol.is_active) await SolenoidModel.updateState(fertilizerSol._id, false);
                if (!waterSol.is_active) await SolenoidModel.updateState(waterSol._id, true);
                action = 'Katup Air Dinyalakan';
            } else if (mode === 'fertilizer') {
                if (waterSol.is_active) await SolenoidModel.updateState(waterSol._id, false);
                if (!fertilizerSol.is_active) await SolenoidModel.updateState(fertilizerSol._id, true);
                action = 'Katup Pupuk Dinyalakan';
            }

            const durationStr = duration ? `${duration} menit` : '—';

            // Log event to history
            await HistoryModel.create({
                type: mode === 'off' ? 'water' : mode,
                action: action,
                detail: `Manual Mode: ${mode.toUpperCase()}`,
                duration: durationStr,
                status: 'success'
            });

            // Create notification
            if (mode !== 'off') {
                await NotificationModel.create({
                    type: 'success',
                    title: action,
                    message: `Katup ${mode === 'water' ? 'air' : 'pupuk'} telah diaktifkan secara manual.`
                });
            }

            const updatedSolenoids = await SolenoidModel.getAll();
            res.json({ message: 'Mode updated successfully', mode, solenoids: updatedSolenoids });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to set solenoid mode' });
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
