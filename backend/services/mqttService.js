const mqtt = require('mqtt');
const ScheduleModel = require('../models/scheduleModel');

const MQTT_BROKER = 'mqtts://broker.hivemq.com:8883';
const SYNC_TOPIC = 'greenhouse-cibatu/schedules/sync'; // Disesuaikan dengan Arduino

let client;

const MqttService = {
    connect: () => {
        if (process.env.VERCEL) return;

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
            
            // Kirim data LENGKAP sesuai format yang diharapkan Arduino
            const scheduleData = schedules.map(s => ({
                name: s.name,
                type: s.type,
                method: s.method || 'alarm',
                time: s.time || '00:00',
                duration: s.duration,
                days: (s.days || []).map(d => d.length > 3 ? d.substring(0, 3) : d),
                interval_value: s.interval_value || 0,
                enabled: s.enabled
            }));
            
            // Kirim sebagai Array JSON mentah (bukan dibungkus object)
            const payload = JSON.stringify(scheduleData);
            console.log('📡 Publishing Schedules:', payload);

            if (client && client.connected) {
                client.publish(SYNC_TOPIC, payload, { retain: true });
                console.log('✅ Jadwal terkirim via koneksi persistent.');
            } else {
                await new Promise((resolve) => {
                    const tempOptions = {
                        clientId: `agrilog-vercel-${Date.now()}`,
                        connectTimeout: 10000,
                    };
                    
                    const tempClient = mqtt.connect(MQTT_BROKER, tempOptions);
                    
                    const safetyTimeout = setTimeout(() => {
                        console.error('⏰ MQTT Timeout: Gagal konek dalam 15 detik.');
                        try { tempClient.end(true); } catch(e) {}
                        resolve();
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
                        resolve();
                    });
                });
            }
        } catch (err) {
            console.error('Failed to publish schedules', err);
        }
    }
};

module.exports = MqttService;
