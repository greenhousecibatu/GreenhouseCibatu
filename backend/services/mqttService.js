const mqtt = require('mqtt');
const ScheduleModel = require('../models/scheduleModel');

const MQTT_BROKER = 'mqtts://broker.hivemq.com:8883';
const SYNC_TOPIC = 'greenhouse-cibatu/irigasi/schedules/sync';

let client;

const MqttService = {
    connect: () => {
        if (process.env.VERCEL) return; // Vercel: pakai koneksi sementara saja

        const mqttOptions = {
            clientId: `agrilog-backend-${Math.random().toString(16).slice(2, 8)}`,
        };
        
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

        client.on('error', (err) => {
            console.error('MQTT Connection Error:', err.message);
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
                // Jika koneksi persistent tersedia (lokal / non-Vercel), langsung publish
                client.publish(SYNC_TOPIC, payload, { retain: true });
                console.log('✅ Jadwal terkirim via koneksi persistent.');
            } else {
                // Fallback: Buat koneksi sementara (Wajib untuk Vercel Serverless)
                await new Promise((resolve, reject) => {
                    const tempOptions = {
                        clientId: `agrilog-vercel-${Date.now()}`,
                        connectTimeout: 10000, // Timeout 10 detik
                    };
                    
                    const tempClient = mqtt.connect(MQTT_BROKER, tempOptions);
                    
                    // Timeout keamanan: jika 15 detik tidak konek, batalkan
                    const safetyTimeout = setTimeout(() => {
                        console.error('⏰ MQTT Timeout: Gagal konek dalam 15 detik.');
                        try { tempClient.end(true); } catch(e) {}
                        resolve(); // Resolve agar API tidak hang
                    }, 15000);
                    
                    tempClient.on('connect', () => {
                        tempClient.publish(SYNC_TOPIC, payload, { retain: true }, (err) => {
                            clearTimeout(safetyTimeout);
                            if (err) {
                                console.error('❌ Gagal publish jadwal:', err.message);
                            } else {
                                console.log('✅ Jadwal terkirim via koneksi sementara (Vercel).');
                            }
                            tempClient.end(false, {}, () => {
                                resolve();
                            });
                        });
                    });
                    
                    tempClient.on('error', (err) => {
                        clearTimeout(safetyTimeout);
                        console.error('❌ MQTT Temp Error:', err.message);
                        try { tempClient.end(true); } catch(e) {}
                        resolve(); // Resolve agar API tetap jalan
                    });
                });
            }
        } catch (err) {
            console.error('Failed to publish schedules', err);
        }
    }
};

module.exports = MqttService;
