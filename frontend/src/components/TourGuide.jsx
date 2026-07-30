import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const TOUR_STEPS = [
    {
        target: null, // Initial welcome screen, no target
        page: 'dashboard',
        title: 'Selamat Datang di Greenhouse Cibatu',
        content: 'Ikuti tur singkat ini untuk melihat semua hal keren yang bisa Anda lakukan di aplikasi kami!',
        buttonStart: 'Ayo Mulai!',
        buttonSkip: 'Nanti'
    },
    {
        target: '#tour-manual-control',
        page: 'dashboard',
        title: 'Kontrol Manual',
        content: 'Nyalakan aliran air atau pupuk secara instan dengan sekali tap. Sangat berguna untuk tindakan cepat.',
    },
    {
        target: '#tour-schedules-tabs',
        page: 'schedules',
        title: 'Mode Jadwal',
        content: 'Pilih jenis jadwal yang Anda butuhkan: Alarm untuk jam tertentu, Mundur untuk waktu dekat, atau Interval untuk perulangan.',
    },
    {
        target: '#tour-schedules-add',
        page: 'schedules',
        title: 'Buat Jadwal Baru',
        content: 'Tekan tombol ini untuk menambahkan jadwal penyiraman atau pemupukan otomatis yang baru.',
    },
    {
        target: '#tour-schedules-card',
        page: 'schedules',
        title: 'Kelola Jadwal',
        content: 'Anda dapat mengaktifkan/menonaktifkan, mengubah, atau menghapus jadwal langsung dari kartu ini.',
    },
    {
        target: '#tour-history-filters',
        page: 'history',
        title: 'Filter Aktivitas',
        content: 'Gunakan filter ini untuk dengan cepat menemukan riwayat spesifik seperti irigasi, pupuk, atau peringatan.',
    }
];

export default function TourGuide() {
    const { isTourActive, setIsTourActive, setCurrentPage } = useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    // Initial check on mount to see if user has seen tour
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('has_seen_tour');
        if (!hasSeenTour) {
            setIsTourActive(true);
        }
    }, [setIsTourActive]);

    // Track target position
    useEffect(() => {
        if (!isTourActive) return;

        const updatePosition = () => {
            const step = TOUR_STEPS[currentStep];
            
            // Switch page if needed
            if (step.page) {
                setCurrentPage(step.page);
            }

            if (step.target) {
                // Wait longer for page transition to complete before finding element
                setTimeout(() => {
                    const el = document.querySelector(step.target);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            const rect = el.getBoundingClientRect();
                            setTargetRect({
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height,
                                bottom: rect.bottom,
                                right: rect.right
                            });
                        }, 300);
                    } else {
                        setTargetRect(null);
                    }
                }, 100); // 100ms delay to let the DOM render the new page
            } else {
                setTargetRect(null);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [isTourActive, currentStep]);

    if (!isTourActive) return null;

    const step = TOUR_STEPS[currentStep];
    const isWelcomeScreen = currentStep === 0;
    const totalSteps = TOUR_STEPS.length - 1; // Exclude welcome screen

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsTourActive(false);
        setCurrentStep(0);
        localStorage.setItem('has_seen_tour', 'true');
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dark Overlay Background - Only show full bg if there is no target */}
            <div 
                className={`absolute inset-0 transition-opacity duration-300 pointer-events-auto ${!targetRect ? 'bg-black/60' : ''}`}
                onClick={handleClose}
            >
                {/* Highlight Hole / Spotlight */}
                {targetRect && (
                    <div 
                        className="absolute bg-transparent rounded-xl transition-all duration-300 ease-out shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] ring-4 ring-white/20"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </div>

            {/* Modal Dialog */}
            <div className={`absolute w-full px-6 transition-all duration-300 pointer-events-auto ${isWelcomeScreen ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm' : ''}`}
                style={!isWelcomeScreen && targetRect ? {
                    // Position tooltip below or above target depending on screen space
                    top: targetRect.bottom + 24 > window.innerHeight - 150 ? targetRect.top - 200 : targetRect.bottom + 24,
                    left: 0
                } : {}}
            >
                <div className={`bg-surface-container-lowest rounded-3xl p-6 shadow-2xl relative max-w-sm mx-auto ${!isWelcomeScreen ? 'animate-fade-in-up' : 'animate-scale-in'}`}>
                    
                    {/* Tooltip Arrow (Only for non-welcome screen) */}
                    {!isWelcomeScreen && targetRect && (
                        <div 
                            className={`absolute w-4 h-4 bg-surface-container-lowest rotate-45 ${targetRect.bottom + 24 > window.innerHeight - 150 ? '-bottom-2' : '-top-2'}`}
                            style={{ left: Math.max(32, Math.min(targetRect.left + (targetRect.width/2) - 8, window.innerWidth - 64)) }}
                        />
                    )}

                    {/* Welcome Illustration */}
                    {isWelcomeScreen && (
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                        </div>
                    )}

                    <h3 className={`font-title-md text-title-md text-on-surface mb-2 ${isWelcomeScreen ? 'text-center' : ''}`}>
                        {step.title}
                    </h3>
                    <p className={`font-body-sm text-body-sm text-on-surface-variant leading-relaxed ${isWelcomeScreen ? 'text-center' : ''}`}>
                        {step.content}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                        {isWelcomeScreen ? (
                            <>
                                <button 
                                    onClick={handleClose}
                                    className="px-6 py-3 rounded-full font-label-bold text-label-bold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
                                >
                                    {step.buttonSkip}
                                </button>
                                <button 
                                    onClick={handleNext}
                                    className="px-6 py-3 rounded-full font-label-bold text-label-bold bg-primary text-on-primary shadow-md hover:shadow-lg transition-all"
                                >
                                    {step.buttonStart}
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="font-label-caps text-label-caps text-outline">
                                    {currentStep} dari {totalSteps}
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleClose}
                                        className="px-4 py-2 rounded-full font-label-bold text-label-bold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
                                    >
                                        Lewati
                                    </button>
                                    <button 
                                        onClick={handleNext}
                                        className="px-6 py-2 rounded-full font-label-bold text-label-bold bg-primary text-on-primary shadow-md hover:shadow-lg transition-all"
                                    >
                                        Lanjut
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
