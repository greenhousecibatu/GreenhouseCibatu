import React from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
    const { solenoids, toggleSolenoid, history, setCurrentPage, weather } = useApp();


    const recentLogs = history.slice(0, 3);

    // Format time
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="space-y-6">
            {/* System Overview Banner */}
            <div>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">System Overview</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Zone 04: Tropical Greenhouse • <span className="text-success font-semibold">Healthy</span></p>
            </div>

            {/* Metrics Bento Grid */}
            <div className="grid grid-cols-2 gap-card-gap">
                {/* Soil Moisture / Weather Humidity */}
                <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10"></div>
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Cibatu Humidity</span>
                    </div>
                    <div>
                        <div className="font-display-lg text-display-lg text-primary">
                            {Math.round(weather.humidity)}<span className="text-title-md font-title-md">%</span>
                        </div>
                        <p className="font-label-bold text-label-bold text-on-surface-variant">Real-time Weather</p>
                    </div>
                </div>

                {/* Temperature */}
                <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error/40 to-error/10"></div>
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat</span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Cibatu Temp</span>
                    </div>
                    <div>
                        <div className="font-display-lg text-display-lg text-on-surface">
                            {weather.temperature.toFixed(1)}<span className="text-title-md font-title-md">°C</span>
                        </div>
                        <p className="font-label-bold text-label-bold text-on-surface-variant">Garut Regency</p>
                    </div>
                </div>
            </div>

            {/* Solenoid Controls */}
            <div className="space-y-card-gap">
                <h2 className="font-title-md text-title-md text-on-surface px-1">Manual Controls</h2>
                
                {solenoids.map(sol => {
                    const isWater = sol.type === 'water';
                    const activeGlow = sol.is_active ? 'active-glow' : '';
                    
                    return (
                        <div
                            key={sol.id}
                            className={`bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/20 flex items-center justify-between transition-all duration-300 ${activeGlow}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isWater ? 'bg-primary-fixed text-primary-container' : 'bg-secondary-fixed text-secondary'}`}>
                                    <span className="material-symbols-outlined scale-125" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {isWater ? 'opacity' : 'science'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-title-md text-title-md text-on-surface">{sol.name}</h3>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">{sol.description}</p>
                                    <p className={`font-label-bold text-label-bold mt-0.5 ${sol.is_active ? (isWater ? 'text-primary' : 'text-secondary') : 'text-outline'}`}>
                                        {sol.is_active ? 'ON — Active' : 'OFF'}
                                    </p>
                                </div>
                            </div>
                            <div
                                className={`toggle-track ${sol.is_active ? 'on' : ''}`}
                                onClick={() => toggleSolenoid(sol.id)}
                            >
                                <div className="toggle-thumb"></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity Log */}
            <div className="space-y-card-gap">
                <div className="flex justify-between items-center px-1">
                    <h2 className="font-title-md text-title-md text-on-surface">Recent Activity</h2>
                    <button
                        onClick={() => setCurrentPage('history')}
                        className="text-primary font-label-bold text-label-bold hover:underline"
                    >
                        View all
                    </button>
                </div>
                
                {recentLogs.length === 0 ? (
                    <div className="text-center py-md">
                        <p className="font-body-sm text-body-sm text-outline">No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentLogs.map(item => {
                            const stripClass = item.type === 'water' ? 'strip-green' : item.type === 'fertilizer' ? 'strip-blue' : 'strip-red';
                            const statusIcon = item.status === 'success'
                                ? <span className="material-symbols-outlined text-primary text-sm" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                : item.status === 'failed'
                                ? <span className="material-symbols-outlined text-error text-sm" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>error</span>
                                : <span className="material-symbols-outlined text-outline text-sm" style={{ fontSize: '16px' }}>schedule</span>;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-surface-container-lowest ${stripClass} p-md rounded-r-xl shadow-sm flex items-center justify-between`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {statusIcon}
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-label-bold text-label-bold text-on-surface truncate">{item.action}</h4>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                                {item.duration !== '—' ? `Duration: ${item.duration}` : item.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-label-caps text-label-caps text-outline ml-2 whitespace-nowrap">
                                        {formatTime(item.created_at)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
