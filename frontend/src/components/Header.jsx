import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function Header() {
    const {
        notifications,
        unreadNotifCount,
        isNotifOpen,
        setIsNotifOpen,
        markNotifRead,
        dismissNotif,
        clearAllNotifications
    } = useApp();

    const drawerRef = useRef(null);

    // Format time ago
    const formatTimeAgo = (dateStr) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Close drawer on clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isNotifOpen && drawerRef.current && !drawerRef.current.contains(event.target) && !event.target.closest('#notifBellBtn')) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifOpen, setIsNotifOpen]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-header shadow-sm w-full">
            <div className="flex justify-between items-center px-container-padding h-16 w-full max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                    </div>
                    <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary whitespace-nowrap">Greenhouse Cibatu</span>
                </div>
                <button
                    id="notifBellBtn"
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high active:scale-95 transition-all text-on-surface-variant"
                >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadNotifCount > 0 && (
                        <span className="notif-badge">
                            {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notification Drawer */}
            <div
                ref={drawerRef}
                className={`notif-drawer bg-surface-container-lowest border-t border-outline-variant/30 shadow-lg ${isNotifOpen ? 'open' : ''}`}
            >
                <div className="max-w-md mx-auto px-container-padding py-md max-h-80 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="font-title-md text-title-md text-on-surface">Notifications</h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                className="font-label-bold text-label-bold text-error hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div className="text-center py-lg">
                            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">notifications_off</span>
                            <p className="font-body-sm text-body-sm text-outline">No notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.slice(0, 10).map(notif => {
                                const icon = notif.type === 'success' ? 'check_circle' : notif.type === 'error' ? 'error' : 'info';
                                const iconColor = notif.type === 'success' ? 'text-primary' : notif.type === 'error' ? 'text-error' : 'text-secondary';
                                const bgClass = notif.is_read ? 'bg-surface-container-low' : 'bg-surface-container-lowest';
                                
                                return (
                                    <div
                                        key={notif.id}
                                        className={`${bgClass} rounded-xl p-3 flex items-start gap-3 transition-colors ${notif.is_read ? 'opacity-70' : ''} cursor-pointer`}
                                        onClick={() => markNotifRead(notif.id)}
                                    >
                                        <span className={`material-symbols-outlined ${iconColor} flex-shrink-0 mt-0.5`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-label-bold text-label-bold text-on-surface truncate">{notif.title}</h4>
                                                <span className="font-label-caps text-label-caps text-outline whitespace-nowrap">{formatTimeAgo(notif.created_at)}</span>
                                            </div>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 truncate">{notif.message}</p>
                                        </div>
                                        <button
                                            className="flex-shrink-0 p-1 rounded-full hover:bg-surface-container-high transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dismissNotif(notif.id);
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
