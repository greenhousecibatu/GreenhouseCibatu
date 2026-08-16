import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function History() {
    const { history, fetchHistory } = useApp();
    const [currentFilter, setCurrentFilter] = useState('all');
    const [methodTab, setMethodTab] = useState('all'); // 'all', 'manual', 'schedule'

    useEffect(() => {
        fetchHistory(currentFilter);
    }, [currentFilter, fetchHistory]);

    // Format time with date
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const dateOpt = { day: 'numeric', month: 'short' };
        const timeOpt = { hour: '2-digit', minute: '2-digit', hour12: true };
        return `${d.toLocaleDateString('id-ID', dateOpt)}, ${d.toLocaleTimeString('en-US', timeOpt)}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Determine if a history item is from manual or schedule
    const isScheduleItem = (item) => {
        return (item.detail && item.detail.toLowerCase().includes('otomatis')) ||
               (item.detail && item.detail.toLowerCase().includes('jadwal')) ||
               (item.action && item.action.toLowerCase().includes('jadwal'));
    };

    // Filter history by method tab
    const getFilteredByMethod = () => {
        if (methodTab === 'all') return history;
        if (methodTab === 'manual') return history.filter(item => !isScheduleItem(item));
        if (methodTab === 'schedule') return history.filter(item => isScheduleItem(item));
        return history;
    };

    // Group items by date key (YYYY-MM-DD)
    const getGroupedHistory = () => {
        const filtered = getFilteredByMethod();
        const groups = {};
        filtered.forEach(item => {
            const date = new Date(item.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    };

    const getDateLabel = (dateKey) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (dateKey === today) return 'Hari Ini';
        if (dateKey === yesterday) return 'Kemarin';

        // Parse key
        return formatDate(dateKey + 'T00:00:00');
    };

    const grouped = getGroupedHistory();

    const filters = [
        { id: 'all', label: 'Semua', icon: null },
        { id: 'water', label: 'Irigasi', icon: 'water_drop' },
        { id: 'fertilizer', label: 'Pupuk', icon: 'science' },
        { id: 'alert', label: 'Peringatan', icon: 'warning' }
    ];

    const methodTabs = [
        { id: 'all', label: 'Semua', icon: 'list' },
        { id: 'manual', label: 'Kontrol Manual', icon: 'touch_app' },
        { id: 'schedule', label: 'Jadwal Otomatis', icon: 'schedule' }
    ];

    // Count items per method tab for badges
    const manualCount = history.filter(item => !isScheduleItem(item)).length;
    const scheduleCount = history.filter(item => isScheduleItem(item)).length;

    return (
        <div id="tour-history-page" className="space-y-lg">
            {/* Header */}
            <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Pelacak Aktivitas</p>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Riwayat Aktivitas</h1>
            </div>

            {/* Method Tabs: Manual vs Jadwal */}
            <div className="flex bg-surface-container-low rounded-xl p-1.5 shadow-sm">
                {methodTabs.map(tab => {
                    const isActive = methodTab === tab.id;
                    const count = tab.id === 'all' ? history.length : tab.id === 'manual' ? manualCount : scheduleCount;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setMethodTab(tab.id)}
                            className={`flex-1 py-2.5 font-label-bold text-center rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                isActive
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-on-surface hover:bg-surface-variant/50'
                            }`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                {tab.icon}
                            </span>
                            <span className="text-xs">{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                isActive ? 'bg-white/20' : 'bg-outline/10'
                            }`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Type Filter Chips */}
            <div id="tour-history-filters" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
                {filters.map(filter => {
                    const isActive = currentFilter === filter.id;
                    return (
                        <button
                            key={filter.id}
                            onClick={() => setCurrentFilter(filter.id)}
                            className={`filter-chip whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant font-label-bold text-label-bold transition-all flex items-center gap-1 ${isActive ? 'active text-on-primary bg-primary' : 'text-on-surface-variant'}`}
                        >
                            {filter.icon && (
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: '14px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    {filter.icon}
                                </span>
                            )}
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/* History List */}
            {Object.keys(grouped).length === 0 ? (
                <div className="text-center py-xl">
                    <span className="material-symbols-outlined empty-state-icon">history_toggle_off</span>
                    <p className="font-title-md text-title-md text-outline mt-3">
                        {methodTab === 'manual' ? 'Tidak Ada Riwayat Manual' : methodTab === 'schedule' ? 'Tidak Ada Riwayat Jadwal' : 'Tidak Ada Riwayat Aktivitas'}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {methodTab === 'manual'
                            ? 'Riwayat kontrol manual akan muncul di sini saat Anda mengoperasikan katup secara langsung.'
                            : methodTab === 'schedule'
                            ? 'Riwayat penjadwalan otomatis akan muncul saat jadwal selesai dijalankan oleh ESP32.'
                            : 'Aktivitas irigasi dan pemupukan Anda akan muncul di sini.'}
                    </p>
                </div>
            ) : (
                <div id="historyList" className="space-y-lg">
                    {Object.entries(grouped)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([dateKey, items]) => (
                            <div key={dateKey} className="animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className="font-label-bold text-label-bold text-on-surface-variant uppercase">
                                        {getDateLabel(dateKey)}
                                    </span>
                                    <div className="flex-1 h-px bg-outline-variant/40"></div>
                                    <span className="font-label-caps text-label-caps text-outline">{items.length} kejadian</span>
                                </div>
                                <div className="space-y-2">
                                    {items
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map(item => {
                                            const stripClass = item.type === 'water' ? 'strip-green' : item.type === 'fertilizer' ? 'strip-blue' : 'strip-red';
                                            const icon = item.type === 'water' ? 'water_drop' : item.type === 'fertilizer' ? 'science' : 'warning';
                                            const iconColor = item.type === 'water' ? 'text-primary' : item.type === 'fertilizer' ? 'text-secondary' : 'text-error';
                                            const isSchedule = isScheduleItem(item);

                                            let statusHTML = null;
                                            if (item.status === 'success') {
                                                statusHTML = (
                                                    <span className="flex items-center gap-1 font-label-bold text-label-bold status-success">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                        Berhasil
                                                    </span>
                                                );
                                            } else if (item.status === 'failed') {
                                                statusHTML = (
                                                    <span className="flex items-center gap-1 font-label-bold text-label-bold status-failed">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>error</span>
                                                        Gagal
                                                    </span>
                                                );
                                            } else {
                                                statusHTML = (
                                                    <span className="flex items-center gap-1 font-label-bold text-label-bold status-pending">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                                                        Tertunda
                                                    </span>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={item._id || item.id}
                                                    className={`bg-surface-container-lowest ${stripClass} p-md rounded-r-2xl shadow-sm`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                                                                    {icon}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-label-bold text-label-bold text-on-surface">{item.action}</h4>
                                                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{item.detail}</p>
                                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                    {/* Badge metode: Manual atau Jadwal */}
                                                                    <span className={`flex items-center gap-0.5 font-label-caps text-label-caps px-1.5 py-0.5 rounded-full ${
                                                                        isSchedule
                                                                            ? 'bg-secondary/10 text-secondary'
                                                                            : 'bg-primary/10 text-primary'
                                                                    }`}>
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>
                                                                            {isSchedule ? 'schedule' : 'touch_app'}
                                                                        </span>
                                                                        {isSchedule ? 'Jadwal' : 'Manual'}
                                                                    </span>
                                                                    {item.duration !== '—' && (
                                                                        <span className="font-label-caps text-label-caps text-outline flex items-center gap-0.5">
                                                                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>timer</span> {item.duration}
                                                                        </span>
                                                                    )}
                                                                    {statusHTML}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="font-label-caps text-label-caps text-outline ml-2 whitespace-nowrap">
                                                            {formatTime(item.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
