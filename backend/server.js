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

// Fetch weather from Open-Meteo API
async function fetchWeather() {
    try {
        // Test connection first
        const conn = await db.getConnection();
        conn.release();

        console.log('☁️ Fetching live weather for Cibatu, Garut (-7.1036087, 107.9876662)...');
        const response = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=-7.1036087&longitude=107.9876662&current=temperature_2m,relative_humidity_2m'
        );

        if (!response.ok) {
            throw new Error(`Open-Meteo API responded with status ${response.status}`);
        }

        const data = await response.json();
        const temp = data.current.temperature_2m;
        const hum = data.current.relative_humidity_2m;

        console.log(`📊 Current weather: ${temp}°C, Humidity: ${hum}%`);
        await WeatherModel.saveReading(temp, hum);
        console.log('✅ Weather reading saved to database.');
    } catch (err) {
        console.error('⚠️ Weather fetch/save failed:', err.message);
    }
}

// Test connection on startup
async function testConnection() {
    try {
        const conn = await db.getConnection();
        console.log('✅ MySQL database connected successfully');
        conn.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('   Make sure MySQL is running and database "agrilog" exists.');
        console.error('   Setup database using: mysql -u root < db/schema.sql');
        return false;
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
        // Fetch weather immediately on start
        await fetchWeather();
        // Schedule every 10 minutes (600000ms)
        setInterval(fetchWeather, 600000);
    }
    console.log('   ==========================================');
});

