import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function History() {
    const { history, fetchHistory } = useApp();
    const [currentFilter, setCurrentFilter] = useState('all');

    useEffect(() => {
        fetchHistory(currentFilter);
    }, [currentFilter, fetchHistory]);

    // Format time
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Format date
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Group items by date key (YYYY-MM-DD)
    const getGroupedHistory = () => {
        const groups = {};
        history.forEach(item => {
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

    return (
        <div className="space-y-lg">
            {/* Header */}
            <div>
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Pelacak Aktivitas</p>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Riwayat Aktivitas</h1>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
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
                    <p className="font-title-md text-title-md text-outline mt-3">Tidak Ada Riwayat Aktivitas</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Aktivitas irigasi dan pemupukan Anda akan muncul di sini.</p>
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
                                                    key={item.id}
                                                    className={`bg-surface-container-lowest ${stripClass} p-md rounded-r-xl shadow-sm`}
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
                                                                <div className="flex items-center gap-3 mt-1.5">
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
