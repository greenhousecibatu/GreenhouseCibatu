// =============================================
// AgriLog - Express Server + REST API
// =============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const apiRoutes = require('./routes/api');
const WeatherModel = require('./models/weatherModel');
const HistoryModel = require('./models/historyModel');

const app = express();
const PORT = process.env.PORT || 3000;

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
            // If the React index.html is not built yet, return a simple welcome message
            res.status(200).send('🌿 AgriLog API Server is running. Frontend not built yet.');
        }
    });
});


// Auto-cleanup history older than 30 days
async function cleanupHistory() {
    try {
        const deletedCount = await HistoryModel.deleteOldRecords();
        if (deletedCount > 0) {
            console.log(`🧹 History cleanup: Deleted ${deletedCount} old records (older than 30 days).`);
        } else {
            console.log(`🧹 History cleanup: No old records to delete.`);
        }
    } catch (err) {
        console.error('⚠️ History cleanup failed:', err.message);
    }
}

// Test connection on startup with retry
async function testConnection(retries = 10, delay = 3000) {
    for (let i = 1; i <= retries; i++) {
        try {
            const conn = await db.getConnection();
            console.log('✅ MySQL database connected successfully');
            conn.release();
            return true;
        } catch (err) {
            console.error(`⏳ Database connection attempt ${i}/${retries} failed: ${err.message}`);
            if (i < retries) {
                console.log(`   Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('❌ All connection attempts failed.');
                console.error('   Make sure MySQL is running and database "agrilog" exists.');
                return false;
            }
        }
    }
}

// Start Server
app.listen(PORT, async () => {
    console.log('🌿 ==========================================');
    console.log('   AgriLog Backend Server (MCP Structure)');
    console.log('   ==========================================');
    console.log(`   🚀 Server running on http://localhost:${PORT}`);
    console.log('');
    const dbOk = await testConnection();
    if (dbOk) {
        // Run history cleanup immediately on start
        await cleanupHistory();
        // Schedule cleanup every 24 hours (86400000ms)
        setInterval(cleanupHistory, 86400000);
    }
    console.log('   ==========================================');
});

