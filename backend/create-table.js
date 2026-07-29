const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to MySQL to apply migration...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        await connection.query('CREATE DATABASE IF NOT EXISTS agrilog');
        await connection.query('USE agrilog');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                temperature FLOAT NOT NULL,
                humidity FLOAT NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        console.log('✅ Table sensor_readings created or verified.');

        const [rows] = await connection.query('SELECT COUNT(*) as count FROM sensor_readings');
        if (rows[0].count === 0) {
            await connection.query('INSERT INTO sensor_readings (temperature, humidity) VALUES (24.0, 68.0)');
            console.log('✅ Seeded initial sensor readings.');
        } else {
            console.log('ℹ️ Sensor readings table already has data.');
        }

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await connection.end();
    }
}

run();
