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
        const docs = await Schedule.find().sort({ time: 1 }).lean();
        return docs.map(d => ({ ...d, id: d._id.toString() }));
    },

    getById: async (id) => {
        const doc = await Schedule.findById(id).lean();
        return doc ? { ...doc, id: doc._id.toString() } : null;
    },

    create: async (data) => {
        const { name, type, method = 'alarm', time = null, duration, days = [], interval_value = null } = data;
        const record = new Schedule({
            name, type, method, time, duration, days, interval_value, enabled: true
        });
        await record.save();
        const obj = record.toObject();
        return { ...obj, id: obj._id.toString() };
    },

    update: async (id, data) => {
        const { name, type, method = 'alarm', time = null, duration, days = [], interval_value = null } = data;
        const updated = await Schedule.findByIdAndUpdate(id, {
            name, type, method, time, duration, days, interval_value
        }, { new: true }).lean();
        return updated ? { ...updated, id: updated._id.toString() } : null;
    },

    delete: async (id) => {
        const record = await Schedule.findByIdAndDelete(id).lean();
        return record ? { ...record, id: record._id.toString() } : null;
    },

    toggleEnabled: async (id) => {
        const record = await Schedule.findById(id);
        if (!record) return null;
        record.enabled = !record.enabled;
        await record.save();
        const obj = record.toObject();
        return { ...obj, id: obj._id.toString() };
    }
};

module.exports = ScheduleModel;
