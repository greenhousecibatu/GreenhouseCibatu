import React from 'react';
import { useApp } from '../context/AppContext';

export default function Settings({ onLogout }) {
    const { showToast, refreshSemua, authFetch, setIsTourActive, setCurrentPage } = useApp();

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
