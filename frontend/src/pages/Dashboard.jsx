import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
    const { solenoids, setManualMode, history, setCurrentPage, deferredPrompt, installPwa, espOnline, mqttConnected, lcdStatus } = useApp();
    const [confirmMode, setConfirmMode] = useState(null);
    const [manualDuration, setManualDuration] = useState(5);

    const handleModeClick = (mode) => {
        if (mode === 'off') {
            setManualMode('off');
        } else {
            setConfirmMode(mode);
            setManualDuration(5); // Reset ke 5 tiap kali buka modal
        }
    };


    const recentLogs = history.slice(0, 3);

    // Format time
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const dateOpt = { day: 'numeric', month: 'short' };
        const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
        return `${d.toLocaleDateString('id-ID', dateOpt)}, ${d.toLocaleTimeString('en-US', timeOpt)}`;
    };

    return (
        <div className="space-y-6">

            {/* Connection Status Bar */}
            <div className={`rounded-2xl p-3.5 border transition-all duration-500 ${
                mqttConnected && espOnline
                    ? 'bg-success/5 border-success/20'
                    : !mqttConnected
                        ? 'bg-error/5 border-error/20'
                        : 'bg-warning/5 border-warning/20'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 ${
                            mqttConnected && espOnline
                                ? 'bg-success/15'
                                : !mqttConnected
                                    ? 'bg-error/15'
                                    : 'bg-warning/15'
                        }`}>
                            <span className={`material-symbols-outlined text-lg transition-colors duration-500 ${
                                mqttConnected && espOnline
                                    ? 'text-success'
                                    : !mqttConnected
                                        ? 'text-error'
                                        : 'text-warning'
                            }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {mqttConnected && espOnline ? 'cloud_done' : !mqttConnected ? 'cloud_off' : 'cloud_alert'}
                            </span>
                        </div>
                        <div>
                            <p className={`font-label-bold text-xs transition-colors duration-500 ${
                                mqttConnected && espOnline
                                    ? 'text-success'
                                    : !mqttConnected
                                        ? 'text-error'
                                        : 'text-warning'
                            }`}>
                                {mqttConnected && espOnline
                                    ? 'Sistem Terhubung'
                                    : !mqttConnected
                                        ? 'Broker Terputus'
                                        : 'ESP32 Offline'}
                            </p>
                            <p className="font-body-sm text-[10px] text-on-surface-variant mt-0.5">
                                {mqttConnected && espOnline
                                    ? 'MQTT & ESP32 aktif — siap menerima perintah'
                                    : !mqttConnected
                                        ? 'Hubungkan MQTT di Pengaturan untuk mengontrol alat'
                                        : 'MQTT terhubung, tapi ESP32 tidak merespon'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${mqttConnected ? 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-error shadow-[0_0_6px_rgba(239,68,68,0.4)]'}`}></div>
                            <span className="text-[8px] font-label-caps text-outline">MQTT</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${espOnline ? 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-error shadow-[0_0_6px_rgba(239,68,68,0.4)]'}`}></div>
                            <span className="text-[8px] font-label-caps text-outline">ESP</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* PWA Install Banner */}
            {deferredPrompt && (
                <div className="bg-primary-container text-on-primary-container rounded-2xl p-4 shadow-md flex items-center justify-between border border-primary/20 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>get_app</span>
                        </div>
                        <div>
                            <h3 className="font-title-sm text-title-sm font-bold">Install Aplikasi</h3>
                            <p className="font-body-sm text-body-sm opacity-90">Akses lebih cepat & praktis</p>
                        </div>
                    </div>
                    <button
                        onClick={installPwa}
                        className="bg-primary text-on-primary px-4 py-2 rounded-full font-label-bold text-label-bold hover:shadow-lg transition-all active:scale-95"
                    >
                        Install
                    </button>
                </div>
            )}
            {/* Solenoid Controls */}
            <div className="space-y-card-gap">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-title-md text-title-md text-on-surface">Kontrol Manual</h2>
                    {mqttConnected && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-label-bold ${espOnline ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                            <div className={`w-2 h-2 rounded-full ${espOnline ? 'bg-success' : 'bg-error'}`}></div>
                            {espOnline ? 'Alat Online' : 'Alat Offline'}
                        </div>
                    )}
                </div>

                {(() => {
                    const activeSolenoid = solenoids.find(s => s.is_active === 1 || s.is_active === true);
                    const currentMode = activeSolenoid ? activeSolenoid.type : 'off';

                    return (
                        <div id="tour-manual-control" className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${currentMode === 'water' ? 'bg-primary-fixed text-primary-container' : currentMode === 'fertilizer' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                                    <span className="material-symbols-outlined scale-125" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {currentMode === 'water' ? 'opacity' : currentMode === 'fertilizer' ? 'science' : 'power_settings_new'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-title-md text-title-md text-on-surface">Mode Saat Ini</h3>
                                    <p className={`font-label-bold text-label-bold mt-0.5 ${currentMode === 'water' ? 'text-primary' : currentMode === 'fertilizer' ? 'text-secondary' : 'text-outline'}`}>
                                        {currentMode === 'water' ? 'AIR MENYALA' : currentMode === 'fertilizer' ? 'PUPUK MENYALA' : 'SEMUA MATI'}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full flex rounded-lg overflow-hidden border border-outline-variant/30">
                                <button
                                    onClick={() => handleModeClick('off')}
                                    className={`flex-1 py-3 font-label-bold text-center transition-colors ${currentMode === 'off' ? 'bg-error text-white' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
                                >
                                    MATI
                                </button>
                                <button
                                    onClick={() => handleModeClick('water')}
                                    className={`flex-1 py-3 font-label-bold text-center transition-colors border-l border-r border-outline-variant/30 ${currentMode === 'water' ? 'bg-primary text-white' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
                                >
                                    AIR
                                </button>
                                <button
                                    onClick={() => handleModeClick('fertilizer')}
                                    className={`flex-1 py-3 font-label-bold text-center transition-colors ${currentMode === 'fertilizer' ? 'bg-secondary text-white' : 'bg-surface text-on-surface hover:bg-surface-container'}`}
                                >
                                    PUPUK
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* LCD Live Monitor */}
            <div className="space-y-card-gap">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-title-md text-title-md text-on-surface">LCD Monitor</h2>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-label-bold ${
                        lcdStatus ? 'bg-success/10 text-success' : 'bg-outline/10 text-outline'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            lcdStatus ? 'bg-success animate-pulse' : 'bg-outline'
                        }`}></div>
                        {lcdStatus ? 'Live' : 'Tidak Ada Sinyal'}
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-inner font-mono text-sm">
                    {lcdStatus ? (
                        <div className="space-y-1">
                            {[lcdStatus.line1, lcdStatus.line2, lcdStatus.line3, lcdStatus.line4].map((line, i) => (
                                <div key={i} className="text-green-400 tracking-wider truncate" style={{ minHeight: '1.25rem' }}>
                                    {line || '\u00a0'}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-500 text-xs">Menunggu data dari ESP32...</p>
                            <p className="text-gray-600 text-xs mt-1">Pastikan alat menyala dan MQTT terhubung</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Aktivitas Terbaru Log */}
            <div className="space-y-card-gap">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-title-md text-title-md text-on-surface">Aktivitas Terbaru</h2>
                    <button
                        onClick={() => setCurrentPage('history')}
                        className="text-primary font-label-bold text-label-bold hover:underline"
                    >
                        Lihat semua
                    </button>
                </div>

                {recentLogs.length === 0 ? (
                    <div className="text-center py-md">
                        <p className="font-body-sm text-body-sm text-outline">Tidak ada aktivitas terbaru</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentLogs.map(item => {
                            const stripClass = item.type === 'water' ? 'strip-green' : item.type === 'fertilizer' ? 'strip-blue' : 'strip-red';
                            const statusIcon = item.status === 'success'
                                ? <span className="material-symbols-outlined text-primary text-sm" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                : item.status === 'failed'
                                    ? <span className="material-symbols-outlined text-error text-sm" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>error</span>
                                    : <span className="material-symbols-outlined text-outline text-sm" style={{ fontSize: '16px' }}>schedule</span>;

                            return (
                                <div
                                    key={item.id || item._id}
                                    className={`bg-surface-container-lowest ${stripClass} p-md rounded-r-xl shadow-sm flex items-center justify-between`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {statusIcon}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-label-bold text-label-bold text-on-surface truncate">{item.action}</h4>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                                {item.duration !== '—' ? `Durasi: ${item.duration}` : item.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-label-caps text-label-caps text-outline ml-2 whitespace-nowrap">
                                        {formatTime(item.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-lg border border-outline-variant/20">
                        <h3 className="font-title-lg text-title-lg text-on-surface mb-2">Konfirmasi Mode Manual</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                            Silakan tentukan berapa lama katup {confirmMode === 'water' ? 'Air' : 'Pupuk'} akan dinyalakan. Alat akan otomatis mati setelah waktu ini habis.
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-label-bold text-on-surface mb-2">Durasi Menyala (Menit)</label>
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={manualDuration}
                                onChange={(e) => setManualDuration(parseInt(e.target.value) || 0)}
                                className="w-full bg-surface-container border border-outline-variant rounded-lg p-3 text-on-surface font-body-large focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        <div className="bg-primary/10 text-primary-dark p-3 rounded-lg flex gap-2 items-start mb-6">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>timer</span>
                            <p className="font-body-sm text-body-sm">
                                Timer akan dihitung dan dikontrol langsung oleh mesin ESP32 secara mandiri, sehingga lebih aman.
                            </p>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmMode(null)}
                                className="px-4 py-2 rounded-full font-label-large text-label-large text-primary hover:bg-surface-variant transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    setManualMode(confirmMode, manualDuration);
                                    setConfirmMode(null);
                                }}
                                className="px-4 py-2 rounded-full font-label-large text-label-large bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                                disabled={manualDuration <= 0}
                            >
                                Mulai Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
