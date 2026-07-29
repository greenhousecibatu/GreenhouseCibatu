import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Schedules() {
    const {
        schedules,
        toggleScheduleEnabled,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        showToast
    } = useApp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editScheduleData, setEditScheduleData] = useState(null);
    const [deleteScheduleId, setDeleteScheduleId] = useState(null);
    const [activeContextId, setActiveContextId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        type: 'water',
        time: '08:00',
        duration: 30,
        days: []
    });

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Stats
    const irrigationActive = schedules.filter(s => s.type === 'water' && s.enabled).length;
    const fertActive = schedules.filter(s => s.type === 'fertilizer' && s.enabled).length;

    // Reset form when modal opens/closes
    useEffect(() => {
        if (editScheduleData) {
            setFormData({
                name: editScheduleData.name,
                type: editScheduleData.type,
                time: editScheduleData.time,
                duration: editScheduleData.duration,
                days: editScheduleData.days || []
            });
        } else {
            setFormData({
                name: '',
                type: 'water',
                time: '08:00',
                duration: 30,
                days: []
            });
        }
    }, [editScheduleData, isModalOpen]);

    // Handle day chip toggle in form
    const toggleDay = (day) => {
        setFormData(prev => {
            const days = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days };
        });
    };

    // Open create modal
    const openCreateModal = () => {
        setEditScheduleData(null);
        setIsModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (schedule) => {
        setActiveContextId(null);
        setEditScheduleData(schedule);
        setIsModalOpen(true);
    };

    // Save form
    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast('error', 'Please enter a schedule name', 'error');
            return;
        }
        if (formData.days.length === 0) {
            showToast('error', 'Please select at least one active day', 'error');
            return;
        }

        if (editScheduleData) {
            await updateSchedule(editScheduleData.id, formData);
        } else {
            await createSchedule(formData);
        }
        setIsModalOpen(false);
    };

    // Trigger delete confirmation
    const triggerDelete = (id) => {
        setActiveContextId(null);
        setDeleteScheduleId(id);
        setIsDeleteOpen(true);
    };

    // Confirm delete
    const handleDeleteConfirm = async () => {
        if (deleteScheduleId) {
            await deleteSchedule(deleteScheduleId);
            setIsDeleteOpen(false);
            setDeleteScheduleId(null);
        }
    };

    // Setup slider duration styles
    const getSliderPct = () => {
        return ((formData.duration - 5) / (180 - 5)) * 100;
    };

    // Close contexts on click outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (activeContextId && !e.target.closest('.context-menu') && !e.target.closest('.ctx-trigger')) {
                setActiveContextId(null);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [activeContextId]);

    return (
        <div className="space-y-lg">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-1">Automation Engine</p>
                    <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Active Schedules</h1>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center bg-primary text-on-primary rounded-full px-4 py-2 font-label-bold text-label-bold shadow-lg active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined mr-1 text-base">add</span> New
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-card-gap">
                <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                    <div className="mt-4">
                        <p className="font-title-md text-title-md text-primary">{irrigationActive} Active</p>
                        <p className="font-label-bold text-label-bold text-outline">Irrigation</p>
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                    <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                    <div className="mt-4">
                        <p className="font-title-md text-title-md text-secondary">{fertActive} Active</p>
                        <p class="font-label-bold text-label-bold text-outline">Fertilizer</p>
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            {schedules.length === 0 ? (
                <div className="text-center py-xl">
                    <span className="material-symbols-outlined empty-state-icon">event_busy</span>
                    <p className="font-title-md text-title-md text-outline mt-3">No Schedules Yet</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Tap "+ New" to create your first automation schedule.</p>
                </div>
            ) : (
                <div className="space-y-card-gap">
                    {schedules.map(schedule => {
                        const isWater = schedule.type === 'water';
                        const colorClass = isWater ? 'primary' : 'secondary';
                        const stripClass = schedule.enabled ? (isWater ? 'strip-green' : 'strip-blue') : 'strip-gray';
                        const icon = isWater ? 'water_drop' : 'science';
                        const bgIcon = isWater ? 'bg-primary-fixed' : 'bg-secondary-fixed';
                        const opacityClass = schedule.enabled ? '' : 'opacity-50';

                        return (
                            <div
                                key={schedule.id}
                                className={`schedule-card bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden ${stripClass} ${opacityClass} relative`}
                            >
                                <div className="p-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`${bgIcon} w-10 h-10 rounded-lg flex items-center justify-center`}>
                                                <span className={`material-symbols-outlined text-${colorClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {icon}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-title-md text-title-md text-on-surface">{schedule.name}</h3>
                                                <p className="font-label-bold text-label-bold text-outline">
                                                    {isWater ? 'Water Valve' : 'Fertilizer Tank'}{schedule.enabled ? '' : ' • Disabled'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div
                                                className={`toggle-track sm ${schedule.enabled ? 'on' : ''}`}
                                                onClick={() => toggleScheduleEnabled(schedule.id)}
                                            >
                                                <div className="toggle-thumb"></div>
                                            </div>
                                            <button
                                                className="p-1 rounded-full hover:bg-surface-container-high transition-colors ctx-trigger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveContextId(activeContextId === schedule.id ? null : schedule.id);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-outline">more_vert</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-md flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={`text-3xl font-bold text-${colorClass} leading-none`} style={{ fontFamily: 'Plus Jakarta Sans' }}>
                                                {schedule.time}
                                            </span>
                                            <span className="font-label-caps text-label-caps text-outline mt-1 uppercase">Starting time</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-title-md text-title-md text-on-surface">{schedule.duration} min</p>
                                            <p className="font-label-caps text-label-caps text-outline uppercase">Duration</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-1.5">
                                        {dayLabels.map((day, i) => {
                                            const active = schedule.days && schedule.days.includes(day);
                                            const activeClass = active
                                                ? (isWater ? 'day-chip selected' : 'day-chip selected-secondary')
                                                : '';
                                            return (
                                                <span
                                                    key={day}
                                                    className={`w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center font-label-bold text-on-surface-variant ${activeClass}`}
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {dayLetters[i]}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Context Menu */}
                                <div className={`context-menu bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden ${activeContextId === schedule.id ? 'show' : ''}`}>
                                    <button
                                        className="flex items-center gap-2 px-4 py-3 w-full hover:bg-surface-container-low transition-colors"
                                        onClick={() => openEditModal(schedule)}
                                    >
                                        <span className="material-symbols-outlined text-primary text-base">edit</span>
                                        <span className="font-body-sm text-body-sm text-on-surface">Edit</span>
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-4 py-3 w-full hover:bg-error-container/30 transition-colors"
                                        onClick={() => triggerDelete(schedule.id)}
                                    >
                                        <span className="material-symbols-outlined text-error text-base">delete</span>
                                        <span className="font-body-sm text-body-sm text-error">Delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            <div className={`modal-overlay fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm ${isModalOpen ? 'show' : ''}`}>
                <div className="modal-content bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                    <div className="bg-gradient-to-br from-primary to-primary-container p-lg text-on-primary flex-shrink-0">
                        <div className="flex justify-between items-center mb-sm">
                            <h3 className="font-headline-lg-mobile text-headline-lg-mobile">
                                {editScheduleData ? 'Edit Schedule' : 'New Schedule'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <p className="font-body-sm text-body-sm opacity-90">Configure timing and delivery parameters for your greenhouse automation.</p>
                    </div>
                    <form className="p-lg space-y-lg overflow-y-auto custom-scrollbar flex-1" onSubmit={e => e.preventDefault()}>
                        {/* Valve Type */}
                        <div className="space-y-xs">
                            <label className="font-label-bold text-label-bold text-outline uppercase px-1">Valve Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'water' }))}
                                    className={`valve-type-btn flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.type === 'water' ? 'border-primary bg-primary-fixed/30 text-primary' : 'border-outline-variant bg-surface-container-low text-outline'}`}
                                >
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                                    <span className="font-label-bold text-label-bold">Water</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'fertilizer' }))}
                                    className={`valve-type-btn flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.type === 'fertilizer' ? 'border-secondary bg-secondary-fixed/30 text-secondary' : 'border-outline-variant bg-surface-container-low text-outline'}`}
                                >
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                                    <span className="font-label-bold text-label-bold">Fertilizer</span>
                                </button>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-xs">
                            <label className="font-label-bold text-label-bold text-outline uppercase px-1">Schedule Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Morning Drip"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-md text-on-surface font-body-lg focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Time */}
                        <div className="space-y-xs">
                            <label className="font-label-bold text-label-bold text-outline uppercase px-1">Start Time</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-md text-on-surface font-headline-lg-mobile text-center focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Days */}
                        <div className="space-y-xs">
                            <label className="font-label-bold text-label-bold text-outline uppercase px-1">Active Days</label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {dayLabels.map(day => {
                                    const isSelected = formData.days.includes(day);
                                    const selectClass = isSelected
                                        ? (formData.type === 'water' ? 'selected' : 'selected-secondary')
                                        : '';
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`day-chip w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center font-label-bold text-on-surface-variant ${selectClass}`}
                                        >
                                            {day.substring(0, 1)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-md">
                            <div className="flex justify-between items-center px-1">
                                <label className="font-label-bold text-label-bold text-outline uppercase">Duration</label>
                                <span className="font-title-md text-title-md text-primary">{formData.duration} min</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="180"
                                step="5"
                                value={formData.duration}
                                onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                style={{ '--val': `${getSliderPct()}%` }}
                                className="w-full h-2 cursor-pointer"
                            />
                            <div className="flex justify-between px-1">
                                <span className="font-label-caps text-label-caps text-outline">5 min</span>
                                <span className="font-label-caps text-label-caps text-outline">180 min</span>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-sm pb-4">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="w-full bg-primary text-on-primary font-title-md py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                            >
                                Save Schedule
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className={`modal-overlay fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-container-padding ${isDeleteOpen ? 'show' : ''}`}>
                <div className="modal-content bg-surface-container-lowest w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-lg text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-error-container flex items-center justify-center mb-md">
                            <span className="material-symbols-outlined text-error text-3xl">delete</span>
                        </div>
                        <h3 className="font-title-md text-title-md text-on-surface mb-2">Delete Schedule?</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">This action cannot be undone. The schedule will be permanently removed.</p>
                    </div>
                    <div className="grid grid-cols-2 border-t border-outline-variant/30">
                        <button
                            className="p-md font-title-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
                            onClick={() => setIsDeleteOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="p-md font-title-md text-error hover:bg-error-container/50 transition-colors border-l border-outline-variant/30"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
