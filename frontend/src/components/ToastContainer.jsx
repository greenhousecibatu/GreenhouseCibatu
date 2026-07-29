import React from 'react';
import { useApp } from '../context/AppContext';

export default function ToastContainer() {
    const { toasts } = useApp();

    return (
        <div id="toastContainer" className="toast-container">
            {toasts.map(toast => {
                const bgClass = toast.type === 'success' ? 'bg-primary-container text-on-surface'
                              : toast.type === 'error' ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container-highest text-on-surface';
                const iconColor = toast.type === 'success' ? 'text-primary'
                                : toast.type === 'error' ? 'text-error'
                                : 'text-on-surface-variant';

                return (
                    <div
                        key={toast.id}
                        className={`toast-item ${bgClass} rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 mb-2 animate-toast-in`}
                    >
                        <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {toast.icon}
                        </span>
                        <span className="font-body-sm text-body-sm flex-1">{toast.message}</span>
                    </div>
                );
            })}
        </div>
    );
}
