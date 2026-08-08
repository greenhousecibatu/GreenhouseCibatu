const mqtt = require('mqtt');
const ScheduleModel = require('../models/scheduleModel');

const MQTT_BROKER = 'mqtts://broker.hivemq.com:8883';
const SYNC_TOPIC = 'greenhouse-cibatu/irigasi/schedules/sync';

const mqttOptions = {
    clientId: `agrilog-backend-${Math.random().toString(16).slice(2, 8)}`,
};

let client;

const MqttService = {
    connect: () => {
        if (process.env.VERCEL) return; // Jangan tahan koneksi background jika di Vercel
        
        client = mqtt.connect(MQTT_BROKER, mqttOptions);
        
        client.on('connect', () => {
            console.log('🔗 Backend connected to MQTT Broker');
            client.subscribe('greenhouse-cibatu/status');
        });
        
        client.on('message', (topic, message) => {
            if (topic === 'greenhouse-cibatu/status' && message.toString() === 'online') {
                // Ketika ESP32 baru menyala, kirimkan jadwal terbaru
                MqttService.publishSchedules();
            }
        });
    },

    publishSchedules: async () => {
        try {
            const schedules = await ScheduleModel.getAll();
            
            // Format ulang agar payload seminimal mungkin untuk ESP32 (menghemat RAM)
            const alarms = schedules
                .filter(s => s.method === 'alarm' && s.enabled)
                .map(s => ({
                    t: s.time, // "08:00"
                    d: s.duration, // menit
                    m: s.type === 'water' ? 0 : 1, // 0 = water, 1 = fertilizer
                    w: s.days.map(d => d.substring(0, 3)) // ["Mon", "Tue"]
                }));
            
            const payload = JSON.stringify({ alarms });
            console.log('📡 Publishing Schedules:', payload);

            if (client && client.connected) {
                client.publish(SYNC_TOPIC, payload, { retain: true });
            } else {
                // Fallback untuk Vercel (Koneksi instan, publish, lalu tutup)
                const tempClient = mqtt.connect(MQTT_BROKER, mqttOptions);
                tempClient.on('connect', () => {
                    tempClient.publish(SYNC_TOPIC, payload, { retain: true }, () => {
                        tempClient.end();
                    });
                });
            }
        } catch (err) {
            console.error('Failed to publish schedules', err);
        }
    }
};

module.exports = MqttService;
