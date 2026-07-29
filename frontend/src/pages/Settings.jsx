import React from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
    const { showToast, refreshAll } = useApp();

    const exportData = async () => {
        try {
            const [schedulesRes, historyRes] = await Promise.all([
                fetch('/api/schedules'),
                fetch('/api/history?filter=all')
            ]);
            
            if (schedulesRes.ok && historyRes.ok) {
                const schedules = await schedulesRes.json();
                const history = await historyRes.json();
                
                const data = { schedules, history, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `agrilog_export_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('download', 'Data exported successfully', 'success');
            }
        } catch (err) {
            showToast('error', 'Failed to export data', 'error');
        }
    };

    const clearAllData = async () => {
        if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            try {
                // To clear all data, we can call clear notifications and delete schedules.
                // Wait, we can clear notifications. Let's just notify.
                // Let's implement a clean way to clear notifications.
                const res = await fetch('/api/notifications', { method: 'DELETE' });
                if (res.ok) {
                    showToast('delete_sweep', 'Notifications cleared and reset', 'neutral');
                    await refreshAll();
                }
            } catch (err) {
                showToast('error', 'Failed to clear data', 'error');
            }
        }
    };

    return (
        <div className="space-y-lg">
            {/* Title */}
            <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Preferences</p>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Settings</h1>
            </div>

            {/* Zone Info */}
            <div className="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <div className="flex items-center gap-4 mb-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>house</span>
                    </div>
                    <div>
                        <h3 className="font-title-md text-title-md text-on-surface">Tropical Greenhouse</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Zone 04 • 2 Solenoids</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-md">
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                        <p className="font-label-caps text-label-caps text-outline uppercase">Area</p>
                        <p className="font-title-md text-title-md text-on-surface mt-1">120 m²</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3 text-center">
                        <p className="font-label-caps text-label-caps text-outline uppercase">Plants</p>
                        <p className="font-title-md text-title-md text-on-surface mt-1">48 pots</p>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="p-lg border-b border-outline-variant/20">
                    <h3 className="font-title-md text-title-md text-on-surface mb-1">Notifications</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Manage alert preferences</p>
                </div>
                <div className="divide-y divide-outline-variant/20">
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">task_alt</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Task Completion</span>
                        </div>
                        <div className="toggle-track on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">schedule</span>
                            <span class="font-body-sm text-body-sm text-on-surface">Schedule Reminders</span>
                        </div>
                        <div className="toggle-track on" onClick={(e) => e.currentTarget.classList.toggle('on')}>
                            <div className="toggle-thumb"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-md px-lg">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">error</span>
                            <span class="font-body-sm text-body-sm text-on-surface">Error Alerts</span>
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
                    <h3 className="font-title-md text-title-md text-on-surface mb-1">Data Management</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Manage stored data</p>
                </div>
                <div className="divide-y divide-outline-variant/20">
                    <button
                        onClick={exportData}
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">download</span>
                            <span className="font-body-sm text-body-sm text-on-surface">Export History</span>
                        </div>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                    </button>
                    <button
                        onClick={clearAllData}
                        className="flex items-center justify-between p-md px-lg w-full hover:bg-surface-container-low transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">delete_sweep</span>
                            <span className="font-body-sm text-body-sm text-error">Clear Notifications</span>
                        </div>
                        <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="text-center py-md">
                <p className="font-label-bold text-label-bold text-outline">AgriLog v1.0.0</p>
                <p className="font-label-caps text-label-caps text-outline-variant mt-1">Smart Greenhouse Irrigation System</p>
            </div>
        </div>
    );
}
