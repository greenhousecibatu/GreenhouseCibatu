import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings({ onLogout }) {
    const { showToast, refreshSemua, authFetch, setIsTourActive, setCurrentPage,
        mqttConnected, mqttConfig, saveMqttConfig, connectMqtt, disconnectMqtt 
    } = useApp();

    const [localMqttConfig, setLocalMqttConfig] = useState(mqttConfig);

    useEffect(() => {
        setLocalMqttConfig(mqttConfig);
    }, [mqttConfig]);

    const handleMqttChange = (e) => {
        const { name, value } = e.target;
        setLocalMqttConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAndConnect = () => {
        saveMqttConfig(localMqttConfig);
        setTimeout(() => connectMqtt(), 100);
    };

    const exportData = async () => {
        try {
            const historyRes = await authFetch('/api/history?filter=all');
            
            if (historyRes.ok) {
                const history = await historyRes.json();
                
                if (history.length === 0) {
                    return showToast('info', 'Tidak ada data riwayat untuk diekspor', 'neutral');
                }

                // Buat Header CSV
                let csvContent = "Waktu,Tipe,Aksi,Detail,Durasi,Status\n";
                
                // Isi Data CSV
                history.forEach(row => {
                    const date = new Date(row.created_at).toLocaleString('id-ID').replace(/,/g, '');
                    const type = row.type || '';
                    const action = row.action || '';
                    const detail = row.detail || '';
                    const duration = row.duration || '';
                    const status = row.status || '';
                    
                    csvContent += `"${date}","${type}","${action}","${detail}","${duration}","${status}"\n`;
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `riwayat_aktivitas_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('download', 'Riwayat berhasil diekspor ke CSV', 'success');
            }
        } catch (err) {
            showToast('error', 'Gagal mengekspor riwayat', 'error');
        }
    };

    const clearSemuaData = async () => {
        if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus semua notifikasi dan riwayat aktivitas?\n\nTindakan ini tidak dapat dibatalkan.')) {
            try {
                const [notifRes, historyRes] = await Promise.all([
                    authFetch('/api/notifications', { method: 'DELETE' }),
                    authFetch('/api/history', { method: 'DELETE' })
                ]);
                
                if (notifRes.ok && historyRes.ok) {
                    showToast('delete_sweep', 'Notifikasi & Riwayat berhasil dihapus', 'neutral');
                    await refreshSemua();
                } else {
                    showToast('error', 'Gagal menghapus sebagian data', 'error');
                }
            } catch (err) {
                showToast('error', 'Gagal menghapus data', 'error');
            }
        }
    };

    const handleLogout = () => {
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            onLogout();
        }
    };

    return (
        <div className="space-y-lg">
            {/* Title */}
            <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Preferensi</p>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Pengaturan</h1>
            </div>

            {/* Notification Preferences */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="p-lg border-b border-outline-variant/20">
                    <h3 className="font-title-md text-title-md text-on-surface mb-1">Notifikasi</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola preferensi peringatan</p>
                </div>
                <div className="divide-y divide-outline-variant/20">
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">task_alt</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Penyelesaian Tugas</span>
                        </div>
                        <div className="toggle-track on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">schedule</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Pengingat Jadwal</span>
                        </div>
                        <div className="toggle-track on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">error</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Peringatan Error</span>
                        </div>
                        <div className="toggle-track on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MQTT Settings */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="p-lg border-b border-outline-variant/20">
                    <h3 className="font-title-md text-title-md text-on-surface mb-1">Integrasi Broker MQTT</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Hubungkan dashboard ke broker MQTT via Secure WebSocket untuk integrasi hardware IoT yang sesungguhnya.</p>
                </div>
                <div className="p-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Host Broker</label>
                            <input type="text" name="host" value={localMqttConfig.host} onChange={handleMqttChange} placeholder="broker.hivemq.com" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Port WebSocket (SSL)</label>
                            <input type="text" name="port" value={localMqttConfig.port} onChange={handleMqttChange} placeholder="8884" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                            <p className="text-[10px] text-outline mt-1">Gunakan 8884 untuk secure (wss), atau 8000 (ws)</p>
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">WebSocket Path</label>
                            <input type="text" name="path" value={localMqttConfig.path} onChange={handleMqttChange} placeholder="/mqtt" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Client ID</label>
                            <input type="text" name="clientId" value={localMqttConfig.clientId} onChange={handleMqttChange} placeholder="Acak otomatis jika kosong" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Username (Opsional)</label>
                            <input type="text" name="username" value={localMqttConfig.username} onChange={handleMqttChange} placeholder="Kosongkan jika publik" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Password (Opsional)</label>
                            <input type="password" name="password" value={localMqttConfig.password} onChange={handleMqttChange} placeholder="Kosongkan jika publik" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Topik Sub Telemetri</label>
                            <input type="text" name="subTopic" value={localMqttConfig.subTopic} onChange={handleMqttChange} placeholder="greenhouse-cibatu/sensor/telemetry" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div>
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Topik Pub Irigasi</label>
                            <input type="text" name="pubTopic" value={localMqttConfig.pubTopic} onChange={handleMqttChange} placeholder="greenhouse-cibatu/irigasi/kontrol/command" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-label-bold text-label-bold text-on-surface mb-1">Topik Status Alat (LWT)</label>
                            <input type="text" name="statusTopic" value={localMqttConfig.statusTopic} onChange={handleMqttChange} placeholder="greenhouse-cibatu/status" className="w-full bg-surface border border-outline-variant rounded-lg p-2 font-body-sm text-on-surface" />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/20">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${mqttConnected ? 'bg-primary' : 'bg-error'}`}></div>
                            <span className="font-label-bold text-label-bold text-on-surface">
                                {mqttConnected ? 'Terhubung' : 'Terputus'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {mqttConnected && (
                                <button onClick={disconnectMqtt} className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-bold hover:bg-surface-variant transition-colors">
                                    Putuskan
                                </button>
                            )}
                            <button onClick={handleSaveAndConnect} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-bold hover:bg-primary/90 transition-colors shadow-sm">
                                {mqttConnected ? 'Perbarui & Reconnect' : 'Hubungkan Broker'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="p-lg border-b border-outline-variant/20">
                    <h3 className="font-title-md text-title-md text-on-surface mb-1">Manajemen Data</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola data tersimpan</p>
                </div>
                <div className="divide-y divide-outline-variant/20">
                    <button
                        onClick={exportData}
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">download</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Ekspor Riwayat</span>
                        </div>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                    </button>
                    <button
                        onClick={clearSemuaData}
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors border-b border-outline-variant/20"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">delete_sweep</span>
                            <span className="font-body-sm text-body-sm text-error">Hapus Riwayat & Notifikasi</span>
                        </div>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                    </button>
                    <button
                        onClick={() => {
                            setCurrentPage('dashboard');
                            setIsTourActive(true);
                        }}
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">explore</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Mulai Panduan Aplikasi</span>
                        </div>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 bg-error/10 text-error rounded-xl font-title-md hover:bg-error/20 transition-colors"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                Keluar
            </button>

            {/* App Info */}
            <div className="text-center py-md">
                <p className="font-label-bold text-label-bold text-outline">Greenhouse Cibatu v1.0.0</p>
                <p className="font-label-caps text-label-caps text-outline-variant mt-1">Sistem Irigasi Greenhouse Pintar</p>
            </div>
        </div>
    );
}
