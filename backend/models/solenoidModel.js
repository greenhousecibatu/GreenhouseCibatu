// =============================================
// Solenoid Model [M] (MongoDB)
// =============================================

const mongoose = require('mongoose');

const solenoidSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    is_active: { type: Boolean, default: false }
});

const Solenoid = mongoose.model('Solenoid', solenoidSchema);

// Initialize Default Solenoids if Empty
const initializeDefaults = async () => {
    try {
        const count = await Solenoid.countDocuments();
        if (count === 0) {
            await Solenoid.insertMany([
                { _id: 1, name: 'Solenoid Air', is_active: false },
                { _id: 2, name: 'Solenoid Pupuk', is_active: false }
            ]);
            console.log('✅ Default solenoids initialized in MongoDB.');
        }
    } catch (err) {
        console.error('⚠️ Failed to initialize default solenoids:', err.message);
    }
};

const SolenoidModel = {
    getAll: async () => {
        await initializeDefaults();
        return await Solenoid.find().sort({ _id: 1 }).lean();
    },

    getById: async (id) => {
        return await Solenoid.findById(id).lean();
    },

    updateState: async (id, is_active) => {
        return await Solenoid.findByIdAndUpdate(id, { is_active }, { new: true }).lean();
    }
};

module.exports = SolenoidModel;
