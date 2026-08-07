// =============================================
// AgriLog - Express Server + REST API
// =============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const HistoryModel = require('./models/historyModel');
const MqttService = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 3000;

// Start MQTT Client
MqttService.connect();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Serves static frontend in production (dist directory)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'), (err) => {
        if (err) {
            res.status(200).send('🌿 AgriLog API Server is running. Frontend not built yet.');
        }
    });
});

// For Vercel Serverless: we need to connect to DB before each request (handled cleanly inside connectDB if already connected)
// But to ensure it's connected when the function boots:
connectDB();

if (process.env.VERCEL) {
    // Export app for Vercel Serverless
    module.exports = app;
} else {
    // Start Server locally
    app.listen(PORT, async () => {
        console.log('🌿 ==========================================');
        console.log('   AgriLog Backend Server (MongoDB)');
        console.log('   ==========================================');
        console.log(`   🚀 Server running on http://localhost:${PORT}`);
        
        // Auto-cleanup history older than 30 days locally
        const cleanupHistory = async () => {
            try {
                const deletedCount = await HistoryModel.deleteOldRecords();
                if (deletedCount > 0) {
                    console.log(`🧹 History cleanup: Deleted ${deletedCount} old records.`);
                }
            } catch (err) {
                console.error('⚠️ History cleanup failed:', err.message);
            }
        };

        // Run immediately, then every 24 hours
        await cleanupHistory();
        setInterval(cleanupHistory, 86400000);
        
        console.log('   ==========================================');
    });
}
