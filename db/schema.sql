-- =============================================
-- AgriLog Database Schema
-- Smart Greenhouse Irrigation System
-- =============================================

CREATE DATABASE IF NOT EXISTS agrilog
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrilog;

-- =============================================
-- TABLE: solenoids
-- =============================================
CREATE TABLE IF NOT EXISTS solenoids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('water', 'fertilizer') NOT NULL,
  description VARCHAR(255) DEFAULT '',
  is_active TINYINT(1) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- TABLE: schedules
-- =============================================
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('water', 'fertilizer') NOT NULL,
  time VARCHAR(5) NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  days JSON NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- TABLE: history
-- =============================================
CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('water', 'fertilizer', 'alert') NOT NULL,
  action VARCHAR(255) NOT NULL,
  detail VARCHAR(255) DEFAULT '',
  duration VARCHAR(50) DEFAULT '—',
  status ENUM('success', 'failed', 'pending') DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('success', 'error', 'info') NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- SEED DATA
-- =============================================

-- Solenoids
INSERT INTO solenoids (name, type, description, is_active) VALUES
  ('Water Solenoid', 'water', 'Main Irrigation Line', 0),
  ('Fertilizer Solenoid', 'fertilizer', 'Nutrient Feed A-1', 0);

-- Schedules
INSERT INTO schedules (name, type, time, duration, days, enabled) VALUES
  ('Zone A - Drip', 'water', '06:30', 45, '["Mon","Wed","Fri"]', 1),
  ('Nutrient Feed', 'fertilizer', '14:00', 15, '["Tue","Thu"]', 1),
  ('Night Mist', 'water', '22:00', 120, '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]', 0);

-- History
INSERT INTO history (type, action, detail, duration, status, created_at) VALUES
  ('water', 'Watering Cycle Completed', 'Zone A - Drip irrigation', '45 min', 'success', NOW()),
  ('fertilizer', 'Nutrient Feed Completed', 'Mix Tank #02 • Feed A-1', '15 min', 'success', NOW() - INTERVAL 2 HOUR),
  ('water', 'Manual Watering', 'Water solenoid toggled ON for 10 min', '10 min', 'success', NOW() - INTERVAL 4 HOUR),
  ('alert', 'High Temp Warning', 'Temperature exceeded 35°C threshold', '—', 'failed', NOW() - INTERVAL 1 DAY),
  ('water', 'Watering Cycle Completed', 'Zone A - Drip irrigation', '45 min', 'success', NOW() - INTERVAL 1 DAY),
  ('fertilizer', 'Scheduled Nutrient Flush', 'Mix Tank #02 • Completed', '15 min', 'success', NOW() - INTERVAL 1 DAY),
  ('alert', 'Sensor Reconnected', 'Moisture sensor Zone 04 back online', '—', 'success', NOW() - INTERVAL 1 DAY);

-- Notifications
INSERT INTO notifications (type, title, message, is_read, created_at) VALUES
  ('success', 'Watering Completed', 'Zone A drip irrigation finished. Duration: 45 min.', 0, NOW()),
  ('success', 'Nutrient Feed Done', 'Fertilizer feed A-1 applied successfully.', 0, NOW() - INTERVAL 2 HOUR),
  ('info', 'Upcoming Schedule', 'Night Mist will start at 22:00 today.', 0, NOW() - INTERVAL 30 MINUTE),
  ('error', 'High Temperature', 'Temperature exceeded 35°C. Auto-ventilation triggered.', 1, NOW() - INTERVAL 1 DAY);

-- =============================================
-- TABLE: sensor_readings
-- =============================================
CREATE TABLE IF NOT EXISTS sensor_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature FLOAT NOT NULL,
  humidity FLOAT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed initial sensor reading
INSERT INTO sensor_readings (temperature, humidity) VALUES (24.0, 68.0);

