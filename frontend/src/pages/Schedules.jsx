import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import WheelPicker from '../components/WheelPicker';
import CircularProgress from '../components/CircularProgress';

// Helper to convert HH:MM:SS to total seconds
const timeToSeconds = (h, m, s) => (h * 3600) + (m * 60) + s;
// Helper to convert total seconds to HH, MM, SS
const secondsToTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { h, m, s };
};

export default function Schedules() {
    const {
        schedules,
        toggleScheduleEnabled,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        showToast,
        timers,
        initTimer,
        updateTimer,
        removeTimer
    } = useApp();

    const [activeTab, setActiveTab] = useState('alarm'); // alarm, countdown, interval

    // Filter schedules by method
    const alarmSchedules = schedules.filter(s => s.method === 'alarm');
    const countdownSchedules = schedules.filter(s => s.method === 'countdown');
    const intervalSchedules = schedules.filter(s => s.method === 'interval');

    return (
        <div id="tour-schedules-page" className="space-y-lg pb-24">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Mesin Otomatisasi</p>
                    <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Jadwal Aktif</h1>
                </div>
            </div>

            {/* Top Tabs */}
            <div id="tour-schedules-tabs" className="flex bg-surface-container-low rounded-xl p-1.5 shadow-sm">
                <button 
                    className={`flex-1 py-3 font-label-bold text-center rounded-lg transition-colors ${activeTab === 'alarm' ? 'bg-primary text-white shadow-md' : 'text-on-surface hover:bg-surface-variant/50'}`}
                    onClick={() => setActiveTab('alarm')}
                >
                    Alarm
                </button>
                <button 
                    className={`flex-1 py-3 font-label-bold text-center rounded-lg transition-colors ${activeTab === 'countdown' ? 'bg-primary text-white shadow-md' : 'text-on-surface hover:bg-surface-variant/50 opacity-50'}`}
                    onClick={() => showToast('info', 'Fitur belum tersedia', 'neutral')}
                >
                    Mundur
                </button>
                <button 
                    className={`flex-1 py-3 font-label-bold text-center rounded-lg transition-colors ${activeTab === 'interval' ? 'bg-primary text-white shadow-md' : 'text-on-surface hover:bg-surface-variant/50 opacity-50'}`}
                    onClick={() => showToast('info', 'Fitur belum tersedia', 'neutral')}
                >
                    Interval
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {activeTab === 'alarm' && (
                    <AlarmTab 
                        schedules={alarmSchedules} 
                        onCreate={createSchedule} 
                        onUpdate={updateSchedule}
                        onDelete={deleteSchedule}
                        onToggle={toggleScheduleEnabled}
                        showToast={showToast}
                    />
                )}
                {activeTab === 'countdown' && (
                    <CountdownTab 
                        schedules={countdownSchedules} 
                        onCreate={createSchedule} 
                        onUpdate={updateSchedule}
                        onDelete={deleteSchedule}
                        onToggle={toggleScheduleEnabled}
                        showToast={showToast}
                        timers={timers}
                        initTimer={initTimer}
                        updateTimer={updateTimer}
                        removeTimer={removeTimer}
                    />
                )}
                {activeTab === 'interval' && (
                    <IntervalTab 
                        schedules={intervalSchedules} 
                        onCreate={createSchedule} 
                        onUpdate={updateSchedule}
                        onDelete={deleteSchedule}
                        onToggle={toggleScheduleEnabled}
                        showToast={showToast}
                    />
                )}
            </div>
        </div>
    );
}

// ==========================================
// ALARM TAB
// ==========================================
function AlarmTab({ schedules, onCreate, onUpdate, onDelete, onToggle, showToast }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editId, setEditId] = useState(null);
    const [timeVal, setTimeVal] = useState({ hour: 8, minute: 0 });
    const [formData, setFormData] = useState({ name: '', type: 'water', duration: 5, days: [] });
    
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLetters = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    // Helper untuk menampilkan hari di card
    const getIndoDay = (enDay) => {
        const map = { 'Mon':'Sen', 'Tue':'Sel', 'Wed':'Rab', 'Thu':'Kam', 'Fri':'Jum', 'Sat':'Sab', 'Sun':'Min' };
        return map[enDay] || enDay;
    };

    const handleEdit = (schedule) => {
        const [h, m] = schedule.time.split(':').map(Number);
        setTimeVal({ hour: h || 0, minute: m || 0 });
        setFormData({ name: schedule.name, type: schedule.type, duration: schedule.duration, days: schedule.days || [] });
        setEditId(schedule.id);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditId(null);
        setFormData({ name: '', type: 'water', duration: 5, days: [] });
    };

    const handleSave = () => {
        if (!formData.name) return showToast('error', 'Nama harus diisi', 'error');
        if (formData.days.length === 0) return showToast('error', 'Pilih minimal satu hari', 'error');
        
        const timeStr = `${String(timeVal.hour).padStart(2,'0')}:${String(timeVal.minute).padStart(2,'0')}`;
        const payload = {
            ...formData,
            method: 'alarm',
            time: timeStr,
            interval_value: 0
        };

        if (editId) {
            onUpdate(editId, payload);
        } else {
            onCreate(payload);
        }
        resetForm();
    };

    return (
        <div className="space-y-6">
            {!isCreating && (
                <button id="tour-schedules-add" onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-primary/50 text-primary font-title-md rounded-2xl hover:bg-primary/5 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add</span> Tambah Alarm
                </button>
            )}

            {isCreating && (
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 space-y-6">
                    <h3 className="font-title-md text-on-surface">{editId ? 'Edit Alarm' : 'Setup Alarm Baru'}</h3>
                    
                    <WheelPicker 
                        columns={[
                            { name: 'hour', options: Array.from({length: 24}, (_, i) => i) },
                            { name: 'minute', options: Array.from({length: 60}, (_, i) => i) }
                        ]}
                        value={timeVal}
                        onChange={(col, val) => setTimeVal(prev => ({ ...prev, [col]: val }))}
                    />
                    
                    <input type="text" placeholder="Nama Alarm" className="w-full bg-surface-container-low p-4 rounded-xl text-on-surface outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div>
                        <label className="text-sm font-bold text-outline uppercase mb-2 block">Hari Aktif</label>
                        <div className="flex gap-1 sm:gap-2 justify-between">
                            {dayLabels.map((day, i) => (
                                <button key={day} type="button" onClick={() => {
                                    const days = formData.days.includes(day) ? formData.days.filter(d => d !== day) : [...formData.days, day];
                                    setFormData({...formData, days});
                                }} className={`flex-1 py-2 sm:py-3 rounded-xl text-[10px] sm:text-sm font-bold flex items-center justify-center transition-colors ${formData.days.includes(day) ? 'bg-primary text-white shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant/50'}`}>
                                    {dayLetters[i]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, type: 'water'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'water' ? 'bg-primary-fixed text-primary' : 'bg-surface-container-low text-outline'}`}>Air</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'fertilizer'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'fertilizer' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container-low text-outline'}`}>Pupuk</button>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-outline uppercase mb-2 flex justify-between">
                            <span>Durasi Menyala</span>
                            <span className="text-primary">{formData.duration} Menit</span>
                        </label>
                        <input 
                            type="range" 
                            min="1" max="120" 
                            value={formData.duration} 
                            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                            className="w-full accent-primary"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={resetForm} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Batal</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg">Simpan</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {schedules.map((s, idx) => (
                    <div key={s.id} id={idx === 0 ? "tour-schedules-card" : undefined}>
                        <StandardCard schedule={s} onToggle={onToggle} onDelete={onDelete} onEdit={() => handleEdit(s)} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// COUNTDOWN TAB
// ==========================================
function CountdownTab({ schedules, onCreate, onUpdate, onDelete, onToggle, showToast, timers, initTimer, updateTimer, removeTimer }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editId, setEditId] = useState(null);
    const [timeVal, setTimeVal] = useState({ h: 0, m: 30, s: 0 });
    const [formData, setFormData] = useState({ name: '', type: 'water', duration: 30 });

    const handleEdit = (schedule) => {
        const { h, m, s } = secondsToTime(schedule.interval_value || 0);
        setTimeVal({ h, m, s });
        setFormData({ name: schedule.name, type: schedule.type, duration: schedule.duration });
        setEditId(schedule.id);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditId(null);
        setFormData({ name: '', type: 'water', duration: 30 });
    };

    const handleSave = () => {
        if (!formData.name) return showToast('error', 'Nama harus diisi', 'error');
        const totalSec = timeToSeconds(timeVal.h, timeVal.m, timeVal.s);
        if (totalSec <= 0) return showToast('error', 'Waktu tidak boleh 0', 'error');

        const payload = {
            ...formData,
            method: 'countdown',
            interval_value: totalSec,
            time: '00:00',
            days: []
        };

        if (editId) {
            onUpdate(editId, payload);
            if (timers[editId]) removeTimer(editId); // reset timer if running
        } else {
            onCreate(payload);
        }
        resetForm();
    };

    return (
        <div className="space-y-6">
            {!isCreating && (
                <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-primary/50 text-primary font-title-md rounded-2xl hover:bg-primary/5 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add</span> Tambah Hitung Mundur
                </button>
            )}

            {isCreating && (
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 space-y-6">
                    <h3 className="font-title-md text-on-surface">{editId ? 'Edit Timer Mundur' : 'Setup Timer Mundur'}</h3>
                    
                    <WheelPicker 
                        columns={[
                            { name: 'h', options: Array.from({length: 24}, (_, i) => i) },
                            { name: 'm', options: Array.from({length: 60}, (_, i) => i) },
                            { name: 's', options: Array.from({length: 60}, (_, i) => i) }
                        ]}
                        value={timeVal}
                        onChange={(col, val) => setTimeVal(prev => ({ ...prev, [col]: val }))}
                    />
                    
                    <input type="text" placeholder="Nama Timer" className="w-full bg-surface-container-low p-4 rounded-xl text-on-surface outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, type: 'water'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'water' ? 'bg-primary-fixed text-primary' : 'bg-surface-container-low text-outline'}`}>Air</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'fertilizer'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'fertilizer' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container-low text-outline'}`}>Pupuk</button>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={resetForm} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Batal</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg">Simpan</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {schedules.map(s => (
                    <CountdownCard 
                        key={s.id} 
                        schedule={s} 
                        onToggle={onToggle} 
                        onDelete={onDelete} 
                        onEdit={() => handleEdit(s)}
                        timers={timers}
                        initTimer={initTimer}
                        updateTimer={updateTimer}
                        removeTimer={removeTimer}
                    />
                ))}
            </div>
        </div>
    );
}

function CountdownCard({ schedule, onToggle, onDelete, onEdit, timers, initTimer, updateTimer, removeTimer }) {
    const totalSecs = schedule.interval_value || 1800;
    const isActive = schedule.enabled;
    const timerState = timers[schedule.id];

    useEffect(() => {
        if (isActive && !timerState) {
            initTimer(schedule.id, totalSecs);
        } else if (!isActive && timerState) {
            removeTimer(schedule.id);
        }
    }, [isActive, schedule.id, totalSecs, timerState, initTimer, removeTimer]);

    const formatTime = (totalSec) => {
        const { h, m, s } = secondsToTime(totalSec);
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    const handleStop = () => {
        if (isActive) onToggle(schedule.id);
        removeTimer(schedule.id);
    };

    const handlePauseToggle = () => {
        if (timerState) {
            updateTimer(schedule.id, { isPaused: !timerState.isPaused });
        }
    };

    if (isActive && timerState) {
        const progress = ((totalSecs - timerState.remaining) / totalSecs) * 100;
        return (
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-primary/20 relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex flex-col">
                    <span className="font-bold text-lg">{schedule.name}</span>
                    <span className="text-sm text-outline">{schedule.type === 'water' ? 'Katup Air' : 'Tangki Pupuk'}</span>
                </div>
                <div className="mt-8">
                    <CircularProgress 
                        progress={progress} 
                        text={formatTime(timerState.remaining)} 
                        subtext={`Total ${totalSecs} seconds`}
                        isPaused={timerState.isPaused}
                        onPause={handlePauseToggle}
                        onStop={handleStop}
                    />
                </div>
            </div>
        );
    }

    // Setup / Inactive State Card
    return (
        <StandardCard schedule={schedule} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} customSub={`Timer: ${formatTime(totalSecs)}`} />
    );
}

// ==========================================
// INTERVAL TAB
// ==========================================
function IntervalTab({ schedules, onCreate, onUpdate, onDelete, onToggle, showToast }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editId, setEditId] = useState(null);
    const [timeVal, setTimeVal] = useState({ h: 2, m: 0, s: 0 });
    const [formData, setFormData] = useState({ name: '', type: 'water', duration: 15 });

    const handleEdit = (schedule) => {
        const { h, m, s } = secondsToTime(schedule.interval_value || 0);
        setTimeVal({ h, m, s });
        setFormData({ name: schedule.name, type: schedule.type, duration: schedule.duration });
        setEditId(schedule.id);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditId(null);
        setFormData({ name: '', type: 'water', duration: 15 });
    };

    const handleSave = () => {
        if (!formData.name) return showToast('error', 'Nama harus diisi', 'error');
        const totalSec = timeToSeconds(timeVal.h, timeVal.m, timeVal.s);
        if (totalSec <= 0) return showToast('error', 'Interval tidak boleh 0', 'error');

        const payload = {
            ...formData,
            method: 'interval',
            interval_value: totalSec,
            time: '00:00',
            days: []
        };

        if (editId) {
            onUpdate(editId, payload);
        } else {
            onCreate(payload);
        }
        resetForm();
    };

    return (
        <div className="space-y-6">
            {!isCreating && (
                <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-primary/50 text-primary font-title-md rounded-2xl hover:bg-primary/5 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">add</span> Tambah Interval
                </button>
            )}

            {isCreating && (
                <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 space-y-6">
                    <h3 className="font-title-md text-on-surface">{editId ? 'Edit Looping Interval' : 'Setup Looping Interval'}</h3>
                    
                    <WheelPicker 
                        columns={[
                            { name: 'h', options: Array.from({length: 24}, (_, i) => i) },
                            { name: 'm', options: Array.from({length: 60}, (_, i) => i) },
                            { name: 's', options: Array.from({length: 60}, (_, i) => i) }
                        ]}
                        value={timeVal}
                        onChange={(col, val) => setTimeVal(prev => ({ ...prev, [col]: val }))}
                    />
                    
                    <input type="text" placeholder="Nama Interval" className="w-full bg-surface-container-low p-4 rounded-xl text-on-surface outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, type: 'water'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'water' ? 'bg-primary-fixed text-primary' : 'bg-surface-container-low text-outline'}`}>Air</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'fertilizer'})} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${formData.type === 'fertilizer' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container-low text-outline'}`}>Pupuk</button>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={resetForm} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold">Batal</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg">Simpan</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {schedules.map(s => {
                    const {h,m,s:sec} = secondsToTime(s.interval_value || 0);
                    const timeStr = `${h}h ${m}m ${sec}s`;
                    return <StandardCard key={s.id} schedule={s} onToggle={onToggle} onDelete={onDelete} onEdit={() => handleEdit(s)} customSub={`Tiap ${timeStr}`} />;
                })}
            </div>
        </div>
    );
}

// ==========================================
// SHARED STANDARD CARD
// ==========================================
function StandardCard({ schedule, onToggle, onDelete, onEdit, customSub }) {
    const isAir = schedule.type === 'water';
    const stripClass = schedule.enabled ? (isAir ? 'strip-green' : 'strip-blue') : 'strip-gray';
    const opacityClass = schedule.enabled ? '' : 'opacity-50';

    return (
        <div className={`bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden ${stripClass} ${opacityClass} relative`}>
            <div className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAir ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-secondary'}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isAir ? 'water_drop' : 'science'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-title-md text-on-surface">{schedule.name}</h3>
                        <p className="text-sm font-bold text-outline">
                            {customSub ? customSub : schedule.time} {schedule.method === 'alarm' && schedule.days && `• ${schedule.days.map(d => {
                                const map = { 'Mon':'Sen', 'Tue':'Sel', 'Wed':'Rab', 'Thu':'Kam', 'Fri':'Jum', 'Sat':'Sab', 'Sun':'Min' };
                                return map[d] || d;
                            }).join(', ')}`}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className={`toggle-track sm ${schedule.enabled ? 'on' : ''}`} onClick={() => onToggle(schedule.id)}>
                        <div className="toggle-thumb"></div>
                    </div>
                    <button onClick={onEdit} className="p-2 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => onDelete(schedule.id)} className="p-2 text-outline hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
