import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

const VoiceAssistant = () => {
    const { setManualMode, createSchedule, showToast } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [isPreModalOpen, setIsPreModalOpen] = useState(false);
    const [pendingCommand, setPendingCommand] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'id-ID';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                console.log('Voice recognized:', transcript);
                showToast('mic', `Mendengar: "${transcript}"`, 'success');
                processVoiceCommand(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    showToast('mic_off', 'Izin mikrofon ditolak', 'error');
                } else if (event.error === 'no-speech') {
                    // Do nothing, just timeout
                } else {
                    showToast('error', 'Error asisten suara', 'error');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn('Speech Recognition API not supported in this browser.');
        }
    }, []);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const parseNumber = (str) => {
        // Urutan sangat penting! Kata yang lebih panjang (puluhan/belasan) harus di atas
        // agar "tiga puluh" tidak terbaca sebagai "tiga".
        const textToNum = {
            'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 'lima puluh': 50, 'enam puluh': 60,
            'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14, 'lima belas': 15,
            'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
            'sepuluh': 10,
            'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
            'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'nol': 0
        };
        const matches = str.match(/\d+/);
        if (matches) return parseInt(matches[0]);
        for (const [key, value] of Object.entries(textToNum)) {
            if (str.includes(key)) return value;
        }
        return null;
    };

    const parseDays = (transcript) => {
        const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        if (transcript.includes('setiap hari') || transcript.includes('tiap hari')) {
            return allDays;
        }
        const detectedDays = [];
        allDays.forEach(day => {
            if (transcript.includes(day.toLowerCase())) {
                detectedDays.push(day);
            }
        });
        return detectedDays.length > 0 ? detectedDays : allDays;
    };

    const processVoiceCommand = (transcript) => {
        const isNyalakan = transcript.includes('nyalakan') || transcript.includes('hidupkan') || transcript.includes('siram');
        const isMatikan = transcript.includes('matikan') || transcript.includes('berhenti') || transcript.includes('matiin');
        const isJadwalkan = transcript.includes('jadwal') || transcript.includes('jadwalkan') || transcript.includes('bikin jadwal');

        const isAir = transcript.includes('air') || transcript.includes('pompa');
        const isPupuk = transcript.includes('pupuk') || transcript.includes('nutrisi');
        
        let durationMinutes = null;
        // Hanya ekstrak durasi dari bagian akhir (setelah 'selama' jika ada)
        const durationMatch = transcript.match(/selama\s+(.+?)\s+menit/i);
        if (durationMatch) {
            durationMinutes = parseNumber(durationMatch[1].trim());
        } else {
            // Coba cari pola "angka menit" di bagian akhir string
            const simpleDurationMatch = transcript.match(/(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|belas|puluh)\s+menit$/i);
            if (simpleDurationMatch) {
                durationMinutes = parseNumber(simpleDurationMatch[1].trim());
            }
        }

        if (isJadwalkan) {
            // Ubah regex agar mendeteksi tanda baca titik dua (:) dan titik (.) yang sering dihasilkan oleh Google Speech
            const timeMatch = transcript.match(/jam\s+([0-9a-zA-Z\s:\.]+)/);
            if (timeMatch) {
                // Buang bagian durasi ("selama ... menit") agar tidak mengganggu parsing jam
                let timeStrText = timeMatch[1].trim().replace(/selama\s+.*$/i, '');
                let hh = 0, mm = 0;
                
                const digits = timeStrText.match(/\d+/g);
                if (digits && digits.length >= 1) {
                    hh = parseInt(digits[0]);
                    if (digits.length >= 2) mm = parseInt(digits[1]);
                } else {
                    if (timeStrText.includes('setengah')) {
                        hh = parseNumber(timeStrText) || 0;
                        mm = 30; hh = hh - 1;
                        if(hh < 0) hh = 0;
                    } else {
                        // Pisahkan antara Jam dan Menit (menggunakan kata lewat/lebih)
                        const parts = timeStrText.split(/lewat|lebih/);
                        hh = parseNumber(parts[0]) || 0;
                        if (parts.length > 1) {
                            mm = parseNumber(parts[1]) || 0;
                        }
                    }
                }
                
                if (transcript.includes('sore') || transcript.includes('malam')) {
                    if (hh < 12) hh += 12;
                }

                if (hh !== null) {
                    const timeStrFormatted = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
                    const type = isAir ? 'water' : (isPupuk ? 'fertilizer' : null);
                    
                    if (type) {
                        const finalDuration = durationMinutes || 5;
                        const finalDays = parseDays(transcript);
                        const daysText = finalDays.length === 7 ? "setiap hari" : `hari ${finalDays.join(' dan ')}`;

                        // Translasikan hari ke format singkatan Inggris (Mon, Tue, Wed...) agar dipahami ESP32
                        const dayMap = {
                            'Senin': 'Mon', 'Selasa': 'Tue', 'Rabu': 'Wed', 'Kamis': 'Thu',
                            'Jumat': 'Fri', 'Sabtu': 'Sat', 'Minggu': 'Sun'
                        };
                        const mappedDays = finalDays.map(d => dayMap[d]);

                        setPendingCommand({
                            type: 'schedule',
                            scheduleData: {
                                name: `Jadwal Suara ${type === 'water' ? 'Air' : 'Pupuk'} (${timeStrFormatted})`,
                                type: type,
                                method: 'alarm', // Pastikan sama dengan manual
                                time: timeStrFormatted,
                                duration: finalDuration,
                                interval_value: 0, // Pastikan 0 bukan null
                                days: mappedDays,
                                is_active: true
                            },
                            messageToSpeak: `Jadwal berhasil ditambahkan. Katup ${type === 'water' ? 'Air' : 'Pupuk'} akan menyala ${daysText} jam ${hh} lebih ${mm} menit, selama ${finalDuration} menit.`,
                            displayTitle: 'Konfirmasi Jadwal Suara',
                            displayMessage: `Jadwalkan katup ${type === 'water' ? 'Air' : 'Pupuk'} ${daysText} pada jam ${timeStrFormatted} selama ${finalDuration} menit?`
                        });
                        speak("Perintah dikenali. Mohon konfirmasi di layar.");
                        return;
                    }
                }
            }
            speak("Maaf, format jadwal tidak dipahami. Coba ucapkan: Jadwalkan air setiap hari jam 8 pagi selama 10 menit.");
            return;
        }

        if (isNyalakan) {
            if (isAir || isPupuk) {
                const type = isAir ? 'water' : 'fertilizer';
                setPendingCommand({
                    type: 'manual_on',
                    modeData: {
                        type: type,
                        duration: durationMinutes ? durationMinutes * 60 : null
                    },
                    messageToSpeak: `Baik, menyalakan ${type === 'water' ? 'air' : 'pupuk'} ${durationMinutes ? 'selama ' + durationMinutes + ' menit' : 'sekarang'}.`,
                    displayTitle: 'Konfirmasi Kontrol Manual',
                    displayMessage: `Menyalakan katup ${type === 'water' ? 'Air' : 'Pupuk'} secara manual${durationMinutes ? ' selama ' + durationMinutes + ' menit' : ''}?`
                });
                speak("Perintah dikenali. Mohon konfirmasi di layar.");
            } else {
                speak("Maaf, tolong sebutkan apakah Anda ingin menyalakan air atau pupuk.");
            }
            return;
        }

        if (isMatikan) {
            setPendingCommand({
                type: 'manual_off',
                messageToSpeak: "Semua katup telah dimatikan.",
                displayTitle: 'Konfirmasi Matikan Sistem',
                displayMessage: `Matikan semua sistem irigasi secara paksa?`
            });
            speak("Perintah dikenali. Mohon konfirmasi di layar.");
            return;
        }

        speak("Maaf, saya tidak mengerti perintah Anda. Coba ucapkan 'Nyalakan air' atau 'Jadwalkan pupuk setiap hari jam 5 sore'.");
    };

    const executeCommand = async () => {
        if (!pendingCommand) return;
        const cmd = pendingCommand;
        setPendingCommand(null);

        if (cmd.type === 'schedule') {
            try {
                await createSchedule(cmd.scheduleData);
                speak(cmd.messageToSpeak);
            } catch (error) {
                speak("Maaf, terjadi kesalahan saat menyimpan jadwal.");
            }
        } else if (cmd.type === 'manual_on') {
            await setManualMode(cmd.modeData.type, cmd.modeData.duration);
            speak(cmd.messageToSpeak);
        } else if (cmd.type === 'manual_off') {
            await setManualMode('off');
            speak(cmd.messageToSpeak);
        }
    };

    const cancelCommand = () => {
        setPendingCommand(null);
        speak("Perintah dibatalkan.");
    };

    const openPreModal = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showToast('mic_off', 'Browser Anda tidak mendukung asisten suara.', 'error');
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setIsPreModalOpen(true);
        }
    };

    const startListening = () => {
        setIsPreModalOpen(false);
        recognitionRef.current?.start();
    };

    return (
        <>
            <button 
                onClick={openPreModal}
                className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform ${isListening ? 'bg-error text-white scale-110 animate-pulse' : 'bg-primary text-white hover:scale-105'}`}
                title="Asisten Suara Pintar"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>
                    {isListening ? 'mic' : 'mic_none'}
                </span>
            </button>

            {/* Pre-Activation Modal with Cheat Sheet */}
            {isPreModalOpen && !isListening && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-lg border border-outline-variant/20 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                            </div>
                            <h3 className="font-title-lg text-title-lg text-on-surface">Asisten Suara Pintar</h3>
                        </div>
                        
                        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                            Sebutkan perintah Anda menggunakan panduan kata kunci di bawah ini:
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/30">
                                <h4 className="font-label-bold text-label-bold text-primary mb-1">🎮 Kontrol Manual</h4>
                                <ul className="text-body-sm list-disc list-inside text-on-surface-variant space-y-1">
                                    <li>"<b>Nyalakan</b> air selama 5 menit"</li>
                                    <li>"<b>Nyalakan</b> pupuk"</li>
                                    <li>"<b>Matikan</b> semua"</li>
                                </ul>
                            </div>
                            <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/30">
                                <h4 className="font-label-bold text-label-bold text-secondary mb-1">⏰ Penjadwalan</h4>
                                <ul className="text-body-sm list-disc list-inside text-on-surface-variant space-y-1">
                                    <li>"<b>Jadwalkan</b> air <b>setiap hari</b> jam 8 pagi selama 10 menit"</li>
                                    <li>"<b>Jadwalkan</b> pupuk hari <b>Senin dan Kamis</b> jam 5 sore selama 2 menit"</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsPreModalOpen(false)}
                                className="px-4 py-2 rounded-full font-label-large text-label-large text-primary hover:bg-surface-variant transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={startListening}
                                className="px-4 py-2 rounded-full font-label-large text-label-large bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">mic</span>
                                Mulai Bicara
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Speech Confirmation Modal */}
            {pendingCommand && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-lg border border-outline-variant/20 animate-fade-in">
                        <h3 className="font-title-lg text-title-lg text-on-surface mb-2">{pendingCommand.displayTitle}</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                            {pendingCommand.displayMessage}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={cancelCommand}
                                className="px-4 py-2 rounded-full font-label-large text-label-large text-error hover:bg-error/10 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeCommand}
                                className="px-4 py-2 rounded-full font-label-large text-label-large bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
