import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [solenoids, setSolenoids] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [weather, setWeather] = useState({ temperature: 24.0, humidity: 68.0 });


    // ---- Toast emitter ----
    const showToast = useCallback((icon, message, type = 'neutral') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, icon, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // ---- API Actions ----
    const fetchSolenoids = useCallback(async () => {
        try {
            const res = await fetch('/api/solenoids');
            if (res.ok) {
                const data = await res.json();
                setSolenoids(data);
            }
        } catch (err) {
            console.error('Fetch solenoids failed:', err);
        }
    }, []);

    const fetchSchedules = useCallback(async () => {
        try {
            const res = await fetch('/api/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (err) {
            console.error('Fetch schedules failed:', err);
        }
    }, []);

    const fetchHistory = useCallback(async (filter = 'all') => {
        try {
            const res = await fetch(`/api/history?filter=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Fetch history failed:', err);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Fetch notifications failed:', err);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadNotifCount(data.count);
            }
        } catch (err) {
            console.error('Fetch unread count failed:', err);
        }
    }, []);

    const fetchLatestWeather = useCallback(async () => {
        try {
            const res = await fetch('/api/weather/latest');
            if (res.ok) {
                const data = await res.json();
                setWeather({
                    temperature: data.temperature,
                    humidity: data.humidity
                });
            }
        } catch (err) {
            console.error('Fetch weather failed:', err);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchSolenoids(),
            fetchSchedules(),
            fetchHistory(),
            fetchNotifications(),
            fetchUnreadCount(),
            fetchLatestWeather()
        ]);
    }, [fetchSolenoids, fetchSchedules, fetchHistory, fetchNotifications, fetchUnreadCount, fetchLatestWeather]);


    // ---- Solenoid Control ----
    const toggleSolenoid = async (id) => {
        try {
            const res = await fetch(`/api/solenoids/${id}/toggle`, { method: 'PUT' });
            if (res.ok) {
                const updated = await res.json();
                setSolenoids(prev => prev.map(s => s.id === updated.id ? updated : s));
                showToast(
                    updated.is_active ? 'check_circle' : 'cancel',
                    `${updated.name} ${updated.is_active ? 'ON' : 'OFF'}`,
                    updated.is_active ? 'success' : 'neutral'
                );
                // Vibrate
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(updated.is_active ? 10 : [10, 5, 10]);
                }
                // Refresh log & notifications
                await Promise.all([fetchHistory(), fetchNotifications(), fetchUnreadCount()]);
            }
        } catch (err) {
            showToast('error', 'Failed to toggle solenoid', 'error');
        }
    };

    // ---- Schedule Controls ----
    const toggleScheduleEnabled = async (id) => {
        try {
            const res = await fetch(`/api/schedules/${id}/toggle`, { method: 'PUT' });
            if (res.ok) {
                const updated = await res.json();
                setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
                showToast(
                    updated.enabled ? 'toggle_on' : 'toggle_off',
                    `"${updated.name}" ${updated.enabled ? 'enabled' : 'disabled'}`,
                    updated.enabled ? 'success' : 'neutral'
                );
            }
        } catch (err) {
            showToast('error', 'Failed to toggle schedule status', 'error');
        }
    };

    const createSchedule = async (scheduleData) => {
        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                const created = await res.json();
                setSchedules(prev => [...prev, created].sort((a,b) => a.time.localeCompare(b.time)));
                showToast('check_circle', `Schedule "${created.name}" created`, 'success');
                await refreshAll();
            }
        } catch (err) {
            showToast('error', 'Failed to create schedule', 'error');
        }
    };

    const updateSchedule = async (id, scheduleData) => {
        try {
            const res = await fetch(`/api/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                const updated = await res.json();
                setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a,b) => a.time.localeCompare(b.time)));
                showToast('check_circle', `Schedule "${updated.name}" updated`, 'success');
                await refreshAll();
            }
        } catch (err) {
            showToast('error', 'Failed to update schedule', 'error');
        }
    };

    const deleteSchedule = async (id) => {
        try {
            const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                setSchedules(prev => prev.filter(s => s.id !== id));
                showToast('delete', `"${data.deleted.name}" deleted`, 'neutral');
                await refreshAll();
            }
        } catch (err) {
            showToast('error', 'Failed to delete schedule', 'error');
        }
    };

    // ---- Notification Controls ----
    const markNotifRead = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
                await fetchUnreadCount();
            }
        } catch (err) { /* ignore */ }
    };

    const dismissNotif = async (id) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                await fetchUnreadCount();
            }
        } catch (err) { /* ignore */ }
    };

    const clearAllNotifications = async () => {
        try {
            const res = await fetch('/api/notifications', { method: 'DELETE' });
            if (res.ok) {
                setNotifications([]);
                setUnreadNotifCount(0);
                showToast('notifications_off', 'All notifications cleared', 'neutral');
            }
        } catch (err) {
            showToast('error', 'Failed to clear notifications', 'error');
        }
    };

    // Initial seed & polling
    useEffect(() => {
        refreshAll();

        // Check for notifications and updates periodically
        const interval = setInterval(async () => {
            await Promise.all([
                fetchSolenoids(),
                fetchHistory(),
                fetchNotifications(),
                fetchUnreadCount(),
                fetchLatestWeather()
            ]);
        }, 15000);

        return () => clearInterval(interval);
    }, [refreshAll, fetchSolenoids, fetchHistory, fetchNotifications, fetchUnreadCount, fetchLatestWeather]);


    return (
        <AppContext.Provider value={{
            currentPage,
            setCurrentPage,
            solenoids,
            schedules,
            history,
            notifications,
            unreadNotifCount,
            toasts,
            isNotifOpen,
            setIsNotifOpen,
            weather,
            showToast,
            refreshAll,
            fetchHistory,
            toggleSolenoid,
            toggleScheduleEnabled,
            createSchedule,
            updateSchedule,
            deleteSchedule,
            markNotifRead,
            dismissNotif,
            clearAllNotifications
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
