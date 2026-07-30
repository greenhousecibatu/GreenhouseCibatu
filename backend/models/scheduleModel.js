// =============================================
// Schedule Model [M] (MongoDB)
// =============================================

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    method: { type: String, default: 'alarm' },
    time: { type: String, default: null },
    duration: { type: Number, required: true },
    days: { type: [String], default: [] },
    interval_value: { type: Number, default: null },
    enabled: { type: Boolean, default: true }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

const ScheduleModel = {
    getAll: async () => {
        return await Schedule.find().sort({ time: 1 }).lean();
    },

    getById: async (id) => {
        return await Schedule.findById(id).lean();
    },

    create: async (data) => {
        const { name, type, method = 'alarm', time = null, duration, days = [], interval_value = null } = data;
        const record = new Schedule({
            name, type, method, time, duration, days, interval_value, enabled: true
        });
        await record.save();
        return record.toObject();
    },

    update: async (id, data) => {
        const { name, type, method = 'alarm', time = null, duration, days = [], interval_value = null } = data;
        const updated = await Schedule.findByIdAndUpdate(id, {
            name, type, method, time, duration, days, interval_value
        }, { new: true }).lean();
        return updated;
    },

    delete: async (id) => {
        const record = await Schedule.findByIdAndDelete(id).lean();
        return record;
    },

    toggleEnabled: async (id) => {
        const record = await Schedule.findById(id);
        if (!record) return null;
        record.enabled = !record.enabled;
        await record.save();
        return record.toObject();
    }
};

module.exports = ScheduleModel;
