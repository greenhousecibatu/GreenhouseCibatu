import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MqttService } from '../services/mqttService';

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
    const [timers, setTimers] = useState({});
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isTourActive, setIsTourActive] = useState(false);

    // ---- MQTT State ----
    const [mqttConnected, setMqttConnected] = useState(false);
    const [espOnline, setEspOnline] = useState(false); // Track ESP32 online/offline
    const [mqttConfig, setMqttConfig] = useState(() => ({
        host: localStorage.getItem('mqtt_host') || 'broker.hivemq.com',
        port: localStorage.getItem('mqtt_port') || '8884',
        path: localStorage.getItem('mqtt_path') || '/mqtt',
        clientId: localStorage.getItem('mqtt_clientId') || `Web_GH_${Math.random().toString(16).slice(2, 8)}`,
        username: localStorage.getItem('mqtt_username') || '',
        password: localStorage.getItem('mqtt_password') || '',
        subTopic: localStorage.getItem('mqtt_subTopic') || 'greenhouse-cibatu/sensor/telemetry',
        pubTopic: localStorage.getItem('mqtt_pubTopic') || 'greenhouse-cibatu/irigasi/kontrol/command',
        statusTopic: localStorage.getItem('mqtt_statusTopic') || 'greenhouse-cibatu/status',
    }));

    const saveMqttConfig = useCallback((newConfig) => {
        setMqttConfig(newConfig);
        Object.keys(newConfig).forEach(key => {
            localStorage.setItem(`mqtt_${key}`, newConfig[key]);
        });
    }, []);

    const connectMqtt = useCallback(() => {
        if (!mqttConfig.host) {
            showToast('error', 'Host Broker belum diisi', 'error');
            return;
        }
        MqttService.connect(
            mqttConfig,
            () => {
                setMqttConnected(true);
                showToast('sensors', 'Terhubung ke MQTT Broker', 'success');
            },
            (topic, message) => {
                console.log('Incoming MQTT:', topic, message);
                // Handle LWT Status from ESP32
                if (topic === mqttConfig.statusTopic) {
                    if (message === 'online') {
                        setEspOnline(true);
                        showToast('wifi', 'ESP32 Terhubung', 'success');
                    } else if (message === 'offline') {
                        setEspOnline(false);
                        showToast('wifi_off', 'ESP32 Terputus (Offline)', 'error');
                    }
                }
                // Future: Handle incoming telemetry from ESP32
            },
            (err) => {
                setMqttConnected(false);
                // showToast('error', `Gagal konek MQTT: ${err.message || 'Error'}`, 'error'); // Can be noisy
            }
        );
    }, [mqttConfig]);

    const disconnectMqtt = useCallback(() => {
        MqttService.disconnect();
        setMqttConnected(false);
        showToast('sensors_off', 'Terputus dari MQTT Broker', 'neutral');
    }, []);

    // ---- PWA Install Listener ----
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const installPwa = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // ---- Auth fetch helper ----
    const authFetch = useCallback((url, options = {}) => {
        const token = localStorage.getItem('gh_token');
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
    }, []);

    // ---- Audio Alarm ----
    const playAlarmSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch(e) { console.error('Audio play failed', e); }
    }, []);


    // ---- Toast emitter ----
    const showToast = useCallback((icon, message, type = 'neutral') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, icon, message, type }]);

        // ---- Push Notification Integration ----
        if (type === 'success' || type === 'error') {
            if ('Notification' in window && Notification.permission === 'granted') {
                const title = type === 'success' ? 'Aktivitas Selesai' : 'Peringatan';
                navigator.serviceWorker?.ready.then(registration => {
                    registration.showNotification(title, {
                        body: message,
                        vibrate: [200, 100, 200]
                    });
                }).catch(() => {
                    new Notification(title, { body: message });
                });
            }
        }

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // ---- API Actions ----
    const fetchSolenoids = useCallback(async () => {
        try {
            const res = await authFetch('/api/solenoids');
            if (res.ok) {
                const data = await res.json();
                setSolenoids(data);
            }
        } catch (err) {
            console.error('Fetch solenoids failed:', err);
        }
    }, [authFetch]);

    const fetchSchedules = useCallback(async () => {
        try {
            const res = await authFetch('/api/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (err) {
            console.error('Fetch schedules failed:', err);
        }
    }, [authFetch]);

    const fetchHistory = useCallback(async (filter = 'all') => {
        try {
            const res = await authFetch(`/api/history?filter=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Fetch history failed:', err);
        }
    }, [authFetch]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await authFetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Fetch notifications failed:', err);
        }
    }, [authFetch]);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await authFetch('/api/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadNotifCount(data.count);
            }
        } catch (err) {
            console.error('Fetch unread count failed:', err);
        }
    }, [authFetch]);

    const fetchLatestWeather = useCallback(async () => {
        try {
            const res = await authFetch('/api/weather/latest');
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
    }, [authFetch]);

    const refreshSemua = useCallback(async () => {
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
    const setManualMode = async (mode, duration = null) => {
        try {
            // IF MQTT IS CONNECTED, PUBLISH TO MQTT FOR ZERO-DELAY
            if (mqttConnected && mqttConfig.pubTopic) {
                const payload = { action: 'set_mode', mode: mode };
                if (duration) payload.duration = duration;
                MqttService.publish(mqttConfig.pubTopic, payload);
                console.log('[MQTT] Published mode:', mode, 'duration:', duration);
            }

            // ALWAYS FALLBACK TO HTTP API TO UPDATE DATABASE & SYNC STATE
            const res = await authFetch('/api/solenoids/mode', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            if (res.ok) {
                const updated = await res.json();
                setSolenoids(updated.solenoids);
                let message = 'Semua Katup Dimatikan';
                if (mode === 'water') message = 'Katup Air Dinyalakan';
                if (mode === 'fertilizer') message = 'Katup Pupuk Dinyalakan';
                
                showToast(
                    mode === 'off' ? 'cancel' : 'check_circle',
                    message + (mqttConnected ? ' (MQTT)' : ''),
                    mode === 'off' ? 'neutral' : 'success'
                );
                
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(mode !== 'off' ? 10 : [10, 5, 10]);
                }
                await Promise.all([fetchHistory(), fetchNotifications(), fetchUnreadCount()]);
            }
        } catch (err) {
            showToast('error', 'Gagal mengubah mode katup', 'error');
        }
    };

    const toggleSolenoid = async (id) => {
        try {
            const res = await authFetch(`/api/solenoids/${id}/toggle`, { method: 'PUT' });
            if (res.ok) {
                const updated = await res.json();
                setSolenoids(prev => prev.map(s => (s.id || s._id) === (updated.id || updated._id) ? updated : s));
                showToast(
                    updated.is_active ? 'check_circle' : 'cancel',
                    `${updated.name} ${updated.is_active ? 'NYALA' : 'MATI'}`,
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
            showToast('error', 'Gagal menyalakan/mematikan katup', 'error');
        }
    };

    // ---- Schedule Controls ----
    const toggleScheduleEnabled = async (id) => {
        try {
            const res = await authFetch(`/api/schedules/${id}/toggle`, { method: 'PUT' });
            if (res.ok) {
                const updated = await res.json();
                setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
                
                // Automatically turn on/off the pump for countdown schedules
                if (updated.method === 'countdown') {
                    if (updated.enabled) {
                        setManualMode(updated.type, updated.duration * 60);
                    } else {
                        setManualMode('off');
                    }
                }

                showToast(
                    updated.enabled ? 'toggle_on' : 'toggle_off',
                    `"${updated.name}" ${updated.enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
                    updated.enabled ? 'success' : 'neutral'
                );
            }
        } catch (err) {
            showToast('error', 'Gagal mengubah status jadwal', 'error');
        }
    };

    const createSchedule = async (scheduleData) => {
        try {
            const res = await authFetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                const created = await res.json();
                setSchedules(prev => [...prev, created].sort((a,b) => a.time.localeCompare(b.time)));
                showToast('check_circle', `Schedule "${created.name}" berhasil dibuat`, 'success');
                await refreshSemua();
            }
        } catch (err) {
            showToast('error', 'Gagal membuat jadwal', 'error');
        }
    };

    const updateSchedule = async (id, scheduleData) => {
        try {
            const res = await authFetch(`/api/schedules/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });
            if (res.ok) {
                const updated = await res.json();
                setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a,b) => a.time.localeCompare(b.time)));
                showToast('check_circle', `Schedule "${updated.name}" berhasil diperbarui`, 'success');
                await refreshSemua();
            }
        } catch (err) {
            showToast('error', 'Gagal memperbarui jadwal', 'error');
        }
    };

    const deleteSchedule = async (id) => {
        try {
            const res = await authFetch(`/api/schedules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                setSchedules(prev => prev.filter(s => s.id !== id));
                showToast('delete', `"${data.deleted.name}" berhasil dihapus`, 'neutral');
                await refreshSemua();
            }
        } catch (err) {
            showToast('error', 'Gagal menghapus jadwal', 'error');
        }
    };

    // ---- Notification Controls ----
    const markNotifRead = async (id) => {
        try {
            const res = await authFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
                await fetchUnreadCount();
            }
        } catch (err) { /* ignore */ }
    };

    const dismissNotif = async (id) => {
        try {
            const res = await authFetch(`/api/notifications/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                await fetchUnreadCount();
            }
        } catch (err) { /* ignore */ }
    };

    const clearSemuaNotifications = async () => {
        try {
            const res = await authFetch('/api/notifications', { method: 'DELETE' });
            if (res.ok) {
                setNotifications([]);
                setUnreadNotifCount(0);
                showToast('notifications_off', 'Semua notifikasi dihapus', 'neutral');
            }
        } catch (err) {
            showToast('error', 'Gagal menghapus notifikasi', 'error');
        }
    };

    // Initial seed & polling
    useEffect(() => {
        refreshSemua();

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
    }, [refreshSemua, fetchSolenoids, fetchHistory, fetchNotifications, fetchUnreadCount, fetchLatestWeather]);

    // Timer control functions
    const updateTimer = useCallback((id, data) => {
        setTimers(prev => ({ ...prev, [id]: { ...prev[id], ...data } }));
    }, []);

    const initTimer = useCallback((id, total) => {
        setTimers(prev => ({ ...prev, [id]: { remaining: total, total, isPaused: false } }));
    }, []);

    const removeTimer = useCallback((id) => {
        setTimers(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    // Mutable ref for toggle and delete to use inside setInterval safely
    const toggleRef = useRef(toggleScheduleEnabled);
    useEffect(() => { toggleRef.current = toggleScheduleEnabled; }, [toggleScheduleEnabled]);
    const deleteRef = useRef(deleteSchedule);
    useEffect(() => { deleteRef.current = deleteSchedule; }, [deleteSchedule]);
    const setManualModeRef = useRef(setManualMode);
    useEffect(() => { setManualModeRef.current = setManualMode; }, [setManualMode]);
    const removeTimerRef = useRef();
    useEffect(() => { removeTimerRef.current = removeTimer; }, [removeTimer]);

    // ---- Global Countdown Ticker ----
    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimers(prev => {
                let hasChanges = false;
                const next = { ...prev };
                for (const id in next) {
                    if (!next[id].isPaused && next[id].remaining > 0) {
                        next[id] = { ...next[id], remaining: next[id].remaining - 1 };
                        hasChanges = true;
                        
                        if (next[id].remaining <= 0) {
                            playAlarmSound();
                            showToast('notifications_active', 'Hitung mundur selesai!', 'success');
                            if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
                            setTimeout(() => {
                                // setManualModeRef.current('off'); // Dihapus karena ESP32 yang mematikan otomatis
                                deleteRef.current(id);
                                if (removeTimerRef.current) removeTimerRef.current(id);
                            }, 0);
                        }
                    }
                }
                return hasChanges ? next : prev;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, [playAlarmSound, showToast]);

    // ---- Auto-Off Timer dipindahkan ke Firmware ESP32 ----
    useEffect(() => {
        // Logika keamanan 2-menit auto-off dihapus karena sekarang ditangani sepenuhnya oleh ESP32
    }, []);


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
            timers,
            updateTimer,
            initTimer,
            removeTimer,
            showToast,
            refreshSemua,
            fetchHistory,
            toggleSolenoid,
            setManualMode,
            toggleScheduleEnabled,
            createSchedule,
            updateSchedule,
            deleteSchedule,
            markNotifRead,
            dismissNotif,
            clearSemuaNotifications,
            authFetch,
            deferredPrompt,
            installPwa,
            isTourActive,
            setIsTourActive,
            mqttConnected,
            espOnline,
            mqttConfig,
            saveMqttConfig,
            connectMqtt,
            disconnectMqtt
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
