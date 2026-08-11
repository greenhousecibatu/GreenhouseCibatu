const mqtt = require('mqtt');
const ScheduleModel = require('../models/scheduleModel');
const HistoryModel = require('../models/historyModel');
const NotificationModel = require('../models/notificationModel');

const MQTT_BROKER = 'mqtts://broker.hivemq.com:8883';
const SYNC_TOPIC = 'greenhouse-cibatu/schedules/sync'; // Disesuaikan dengan Arduino

let client;

const MqttService = {
    connect: () => {
        // [BUG FIX 5] Izinkan MQTT berjalan di Vercel agar backend bisa terima laporan jadwal
        // Catatan: di lingkungan Serverless (Vercel), proses ini akan di-invoke pada setiap request
        // tapi setidaknya memberi kesempatan untuk connect dan publish.

        const mqttOptions = {
            clientId: `agrilog-backend-${Math.random().toString(16).slice(2, 8)}`,
        };
        
        client = mqtt.connect(MQTT_BROKER, mqttOptions);
        
        client.on('connect', () => {
            console.log('🔗 Backend connected to MQTT Broker');
            client.subscribe('greenhouse-cibatu/status');
            // Dengarkan permintaan sinkronisasi aktif dari ESP32
            client.subscribe('greenhouse-cibatu/schedules/request');
            // Dengarkan laporan eksekusi jadwal dari ESP32
            client.subscribe('greenhouse-cibatu/status/execution');
        });
        
        client.on('message', async (topic, message) => {
            if (topic === 'greenhouse-cibatu/status' && message.toString() === 'online') {
                // ESP32 muncul online → kirim jadwal
                MqttService.publishSchedules();
            }
            if (topic === 'greenhouse-cibatu/schedules/request') {
                // ESP32 secara aktif meminta data jadwal terbaru
                console.log('📥 ESP32 meminta sinkronisasi jadwal...');
                MqttService.publishSchedules();
            }
            if (topic === 'greenhouse-cibatu/status/execution') {
                // ESP32 melaporkan jadwal selesai dijalankan
                try {
                    const data = JSON.parse(message.toString());
                    const typeName = data.type === 'water' ? 'Air' : 'Pupuk';
                    const durationStr = data.duration ? `${data.duration} menit` : '—';
                    console.log(`📋 Jadwal selesai: ${data.name} (${typeName}) selama ${durationStr}`);

                    await HistoryModel.create({
                        type: data.type || 'water',
                        action: `Jadwal ${typeName} Selesai: ${data.name || 'Tanpa Nama'}`,
                        detail: `Otomatis via Jadwal (${data.method || 'alarm'})`,
                        duration: durationStr,
                        status: 'success'
                    });

                    await NotificationModel.create({
                        type: 'success',
                        title: `✅ Jadwal ${typeName} Selesai`,
                        message: `"${data.name || 'Jadwal'}" berhasil dijalankan selama ${durationStr}.`
                    });

                    console.log('✅ Riwayat jadwal berhasil disimpan ke database.');
                } catch (e) {
                    console.error('❌ Gagal parse laporan eksekusi jadwal:', e.message);
                }
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
