import React from 'react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
    const { currentPage, setCurrentPage } = useApp();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'potted_plant' },
        { id: 'schedules', label: 'Jadwal', icon: 'event_repeat' },
        { id: 'history', label: 'Riwayat', icon: 'history' },
        { id: 'settings', label: 'Pengaturan', icon: 'settings' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-surface-container-lowest shadow-[0_-4px_16px_rgba(0,0,0,0.06)] rounded-t-2xl z-50 pb-safe">
            <div className="max-w-md mx-auto flex justify-around items-center px-2 py-2">
                {navItems.map(item => {
                    const isActive = currentPage === item.id;
                    return (
                        <button
                            key={item.id}
                            id={item.id === 'schedules' ? 'tour-nav-schedules' : item.id === 'history' ? 'tour-nav-history' : undefined}
                            onClick={() => setCurrentPage(item.id)}
                            className={`nav-item flex flex-col items-center justify-center rounded-full px-4 py-1.5 transition-all duration-200 active:scale-90 ${isActive ? 'active' : ''}`}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <span className="font-label-bold text-label-bold mt-0.5">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
