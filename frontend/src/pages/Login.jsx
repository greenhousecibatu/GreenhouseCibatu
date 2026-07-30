import React, { useState } from 'react';

export default function Login({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('gh_token', data.token);
                // Request Notification Permission
                if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
                onLogin(data.token);
            } else {
                setError(data.error || 'Password salah');
                setPassword('');
            }
        } catch (err) {
            setError('Gagal terhubung ke server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-secondary/5 blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-sm space-y-8">
                {/* Logo & Title */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mx-auto shadow-lg">
                        <span className="material-symbols-outlined text-on-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                    </div>
                    <div>
                        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Greenhouse Cibatu</h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Smart Irrigation Dashboard</p>
                    </div>
                </div>

                {/* Login Card */}
                <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-3xl p-8 shadow-lg border border-outline-variant/20 space-y-6">
                    <div className="text-center">
                        <h2 className="font-title-md text-title-md text-on-surface">Masuk ke Dashboard</h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Masukkan password untuk melanjutkan</p>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="font-label-bold text-label-bold text-on-surface-variant block">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>lock</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                autoFocus
                                className="w-full bg-surface-container-low pl-12 pr-12 py-4 rounded-xl text-on-surface font-body-sm outline-none border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 bg-error/10 text-error px-4 py-3 rounded-xl animate-fade-in">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>error</span>
                            <span className="font-label-bold text-label-bold">{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className={`w-full py-4 rounded-xl font-title-md text-title-md shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                            isLoading || !password
                                ? 'bg-outline/30 text-outline cursor-not-allowed'
                                : 'bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98]'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Memverifikasi...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>login</span>
                                Masuk
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center font-label-caps text-label-caps text-outline-variant">
                    Greenhouse Cibatu v1.0.0
                </p>
            </div>
        </div>
    );
}
