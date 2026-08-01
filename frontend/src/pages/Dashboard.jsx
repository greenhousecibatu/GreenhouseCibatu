import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
    const { solenoids, setManualMode, history, setCurrentPage, weather, deferredPrompt, installPwa, espOnline, mqttConnected } = useApp();
    const [confirmMode, setConfirmMode] = useState(null);

    const handleModeClick = (mode) => {
        if (mode === 'off') {
            setManualMode('off');
        } else {
            setConfirmMode(mode);
        }
    };


    const recentLogs = history.slice(0, 3);

    // Format time
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="space-y-6">

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
                                    key={item.id}
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
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                            Apakah Anda yakin ingin menyalakan katup {confirmMode === 'water' ? 'Air' : 'Pupuk'} secara manual? Ini akan mengambil alih sistem dari jadwal otomatis.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setConfirmMode(null)}
                                className="px-4 py-2 rounded-full font-label-large text-label-large text-primary hover:bg-surface-variant transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={() => {
                                    setManualMode(confirmMode);
                                    setConfirmMode(null);
                                }}
                                className="px-4 py-2 rounded-full font-label-large text-label-large bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
