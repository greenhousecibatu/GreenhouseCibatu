import React from 'react';
import { useApp } from '../context/AppContext';

export default function Settings({ onLogout }) {
    const { showToast, refreshSemua, authFetch } = useApp();

    const exportData = async () => {
        try {
            const [schedulesRes, historyRes] = await Promise.all([
                authFetch('/api/schedules'),
                authFetch('/api/history?filter=all')
            ]);
            
            if (schedulesRes.ok && historyRes.ok) {
                const schedules = await schedulesRes.json();
                const history = await historyRes.json();
                
                const data = { schedules, history, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `greenhouse_cibatu_export_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('download', 'Data berhasil diekspor', 'success');
            }
        } catch (err) {
            showToast('error', 'Gagal mengekspor data', 'error');
        }
    };

    const clearSemuaData = async () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus semua data? Ini tidak dapat dibatalkan.')) {
            try {
                const res = await authFetch('/api/notifications', { method: 'DELETE' });
                if (res.ok) {
                    showToast('delete_sweep', 'Notifikasi berhasil dihapus', 'neutral');
                    await refreshSemua();
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

            {/* Zone Info */}
            <div className="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <div className="flex items-center gap-4 mb-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>house</span>
                    </div>
                    <div>
                        <h3 className="font-title-md text-title-md text-on-surface">Greenhouse Tropis</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Zona 04 • 2 Solenoid</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-md">
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                        <p className="font-label-caps text-label-caps text-outline uppercase">Luas Area</p>
                        <p className="font-title-md text-title-md text-on-surface mt-1">120 m²</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                        <p className="font-label-caps text-label-caps text-outline uppercase">Tanaman</p>
                        <p className="font-title-md text-title-md text-on-surface mt-1">48 pot</p>
                    </div>
                </div>
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
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">delete_sweep</span>
                            <span className="font-body-sm text-body-sm text-error">Hapus Semua Notifikasi</span>
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
