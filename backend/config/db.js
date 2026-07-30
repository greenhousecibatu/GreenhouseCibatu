// =============================================
// AgriLog - Database Connection Configuration (MongoDB)
// =============================================

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;
        
        const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        if (!uri) throw new Error("MongoDB connection string is missing");

        await mongoose.connect(uri);
        console.log('✅ MongoDB Atlas connected successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
